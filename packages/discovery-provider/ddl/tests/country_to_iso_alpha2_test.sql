begin; do $$
declare
begin

  assert country_to_iso_alpha2('United States') = 'US';
  assert country_to_iso_alpha2('Ireland') = 'IE';

end; $$ LANGUAGE plpgsql;
