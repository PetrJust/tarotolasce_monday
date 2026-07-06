// Připojení k PostgreSQL. Aktivní jen když je nastavená proměnná DATABASE_URL.
// Bez ní se nikdy neimportuje balíček "pg" a aplikace běží na souborovém mocku
// (lib/store.ts). Díky tomu projekt funguje lokálně i bez databáze a v produkci
// stačí nastavit DATABASE_URL, žádná změna kódu.
//
// Produkce (Webglobe): vytvoř PostgreSQL databázi a nastav v prostředí:
//   DATABASE_URL=postgres://uzivatel:heslo@host:5432/databaze
//   PGSSL=require        (pokud server vyžaduje SSL; jinak vynech)

const SCHEMA = `
create table if not exists readings (
  id text primary key,
  email text,
  question text not null,
  spread_key text not null,
  spread_name text not null,
  cards jsonb not null,
  text text not null,
  created_at bigint not null
);
create index if not exists readings_email_idx on readings (email, created_at desc);

create table if not exists feedback (
  reading_id text primary key,
  rating text not null,
  comment text not null default '',
  created_at bigint not null
);
`;

let poolPromise: Promise<any> | null = null;

export function hasDb(): boolean {
  return !!process.env.DATABASE_URL;
}

async function getPool(): Promise<any | null> {
  if (!hasDb()) return null;
  if (!poolPromise) {
    poolPromise = (async () => {
      // Dynamický import: "pg" se načte jen na serveru s nastavenou DATABASE_URL
      const pg: any = await import("pg");
      const Pool = pg.Pool ?? pg.default?.Pool;
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.PGSSL === "require"
            ? { rejectUnauthorized: false }
            : undefined,
        max: 5,
      });
      // Idempotentní vytvoření schématu při prvním připojení
      await pool.query(SCHEMA);
      return pool;
    })().catch((e) => {
      // Když se DB nepodaří inicializovat, vrátíme null a spadneme na mock
      console.error("DB init failed, fallback to file store:", e?.message ?? e);
      poolPromise = null;
      return null;
    });
  }
  return poolPromise;
}

export async function dbQuery(text: string, params: any[] = []): Promise<any | null> {
  const pool = await getPool();
  if (!pool) return null;
  return pool.query(text, params);
}
