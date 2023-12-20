update users
set cover_photo_sizes = split_part(substring(cover_photo_sizes from '%/content/'), '/', 1),
    profile_picture_sizes = split_part(substring(profile_picture_sizes from '%/content/'), '/', 1)
where handle_lc in ('resuonex', 'nestamusic', 'taskforce', 'kingfallou', 'letsdancebirds', 'fuxsmrt', 'niko5462', 'wc0b0z', 'adubtor', 'ramey02', 'hoodrichclement', 'olilc', 'freshmoods', 'garworld', 'nikkikang', 'notjulian', 'producent', 'raymondphil2', 'bestmusictracks', 'dejayjd', 'mikeshoe504', 'derfoe', 'rodneycarroll5', 'plasticcogliquid');
