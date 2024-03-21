begin; do $$
declare
begin

  assert id_encode(1) = '7eP5n';
  assert id_decode('7eP5n') = 1;

end; $$ LANGUAGE plpgsql;
