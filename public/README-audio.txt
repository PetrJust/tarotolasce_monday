Sem patří zvukový soubor šustění karet pro rituál:
  public/shuffle.mp3  (krátké, cca 1,2 s, tiché šustění karet)

V mock režimu komponenta funguje i bez souboru: pokud se /shuffle.mp3
nepodaří načíst, použije se jemný WebAudio fallback (šum přes bandpass).
Stačí tedy soubor přidat později, nic dalšího se nemusí měnit.
