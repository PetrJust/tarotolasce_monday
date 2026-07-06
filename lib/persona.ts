// Procesní invariant 4 (v1.1): jméno persony jako jediná konstanta.
// Budoucí přejmenování = změna tady, nikde jinde.
// Invariant 5 (ochranný režim jména): na externě viditelných plochách
// (title, meta, OG) a při prvním výskytu na stránce vždy plná forma
// (PERSONA_FULL nebo PERSONA_BRAND). „{jméno} AI" je zakázané úplně.
export const PERSONA_NAME = "Nomi";
export const PERSONA_FULL = `AI kartářka ${PERSONA_NAME}`;
export const PERSONA_BRAND = `${PERSONA_NAME} z Tarotu o Lásce`;
export const EMAIL_SENDER = `${PERSONA_BRAND} <ahoj@tarotolasce.cz>`;
