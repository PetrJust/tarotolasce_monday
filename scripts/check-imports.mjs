// Projektová kontrola před zabalením:
//  1) každý @/ import ukazuje na existující export
//  2) každá JSX komponenta (PascalCase tag) je importovaná NEBO lokálně
//     deklarovaná - chytá „Cannot find name X" (co shodilo build 2x)
//  3) parse chyby
import { createRequire } from "node:module";
const require2 = createRequire(import.meta.url);
let ts;
try { ts = require2("typescript"); } catch { ts = require2("/home/claude/.npm-global/lib/node_modules/typescript/lib/typescript.js"); }
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (!["node_modules", ".next", ".git", ".data"].includes(e.name)) walk(p);
    } else if (/\.(ts|tsx)$/.test(e.name)) files.push(p);
  }
})(ROOT);

const exportsByModule = {};
function modKey(f) { return "@/" + path.relative(ROOT, f).replace(/\\/g, "/").replace(/\.(ts|tsx)$/, ""); }
function collect(f) {
  const src = fs.readFileSync(f, "utf8");
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.ES2020, true, f.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const ex = new Set();
  sf.statements.forEach((st) => {
    const mods = st.modifiers || [];
    const isExp = mods.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (isExp) {
      if (ts.isFunctionDeclaration(st) && st.name) ex.add(st.name.text);
      if (ts.isClassDeclaration(st) && st.name) ex.add(st.name.text);
      if (ts.isVariableStatement(st)) st.declarationList.declarations.forEach((d) => d.name && d.name.text && ex.add(d.name.text));
      if (ts.isTypeAliasDeclaration(st) && st.name) ex.add(st.name.text);
      if (ts.isInterfaceDeclaration(st) && st.name) ex.add(st.name.text);
      if (ts.isEnumDeclaration(st) && st.name) ex.add(st.name.text);
    }
    if (ts.isExportDeclaration(st) && st.exportClause && ts.isNamedExports(st.exportClause)) st.exportClause.elements.forEach((e) => ex.add(e.name.text));
  });
  if (/export default/.test(src)) ex.add("default");
  return { sf, src, ex };
}

const parsed = {};
files.forEach((f) => { parsed[f] = collect(f); exportsByModule[modKey(f)] = parsed[f].ex; });

let problems = 0, perr = 0;
for (const f of files) {
  const { sf, src } = parsed[f];
  if ((sf.parseDiagnostics || []).length) { perr++; console.log("PARSE ERR", modKey(f)); }

  // co je v souboru importované / lokálně deklarované
  const known = new Set(["React", "Fragment"]);
  sf.statements.forEach((st) => {
    if (ts.isImportDeclaration(st) && st.importClause) {
      const ic = st.importClause;
      if (ic.name) known.add(ic.name.text);
      if (ic.namedBindings) {
        if (ts.isNamedImports(ic.namedBindings)) ic.namedBindings.elements.forEach((e) => known.add(e.name.text));
        else known.add(ic.namedBindings.name.text);
      }
      // kontrola 1: @/ import má existující export
      const spec = st.moduleSpecifier.text;
      if (spec.startsWith("@/")) {
        const target = exportsByModule[spec];
        if (target) {
          if (ic.name && !target.has("default")) { problems++; console.log("MISSING default in", spec, "<-", modKey(f)); }
          if (ic.namedBindings && ts.isNamedImports(ic.namedBindings)) ic.namedBindings.elements.forEach((el) => {
            const nm = (el.propertyName || el.name).text;
            if (!target.has(nm)) { problems++; console.log("MISSING", nm, "from", spec, "<-", modKey(f)); }
          });
        }
      }
    }
    // lokální deklarace
    if (ts.isFunctionDeclaration(st) && st.name) known.add(st.name.text);
    if (ts.isClassDeclaration(st) && st.name) known.add(st.name.text);
    if (ts.isVariableStatement(st)) st.declarationList.declarations.forEach((d) => d.name && d.name.text && known.add(d.name.text));
  });
  // vnořené deklarace (const X = ... uvnitř funkcí) - projdi celý strom
  (function deep(node) {
    if (ts.isVariableDeclaration(node) && node.name && ts.isIdentifier(node.name)) known.add(node.name.text);
    if (ts.isFunctionDeclaration(node) && node.name) known.add(node.name.text);
    ts.forEachChild(node, deep);
  })(sf);

  // kontrola 2: JSX PascalCase tagy musí být známé
  const used = new Set();
  (function deep(node) {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ts.isIdentifier(node.tagName)) {
      const n = node.tagName.text;
      if (/^[A-Z]/.test(n)) used.add(n);
    }
    ts.forEachChild(node, deep);
  })(sf);
  for (const n of used) {
    if (!known.has(n)) { problems++; console.log("UNIMPORTED JSX component <" + n + "> in", modKey(f)); }
  }
}
console.log(`${files.length} souborů · parse: ${perr} · problémy: ${problems}${(perr + problems) === 0 ? " ✓" : ""}`);
process.exit(perr + problems ? 1 : 0);
