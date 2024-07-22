begin;
  update tracks
  set musical_key = NULL
  where LENGTH(musical_key) > 12;
commit;
