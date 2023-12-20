update users
set cover_photo_sizes = regexp_replace(cover_photo_sizes, '.*content\/([^\/]+)\/.*', '\1', 'g'),
    profile_picture_sizes = regexp_replace(profile_picture_sizes, '.*content\/([^\/]+)\/.*', '\1', 'g')
where handle_lc in ('nestamusic', 'taskforce', 'kingfallou', 'letsdancebirds', 'fuxsmrt', 'niko5462', 'wc0b0z', 'adubtor', 'ramey02', 'hoodrichclement', 'olilc', 'freshmoods', 'garworld', 'nikkikang', 'notjulian', 'producent', 'raymondphil2', 'bestmusictracks', 'dejayjd', 'mikeshoe504', 'derfoe', 'rodneycarroll5', 'plasticcogliquid');
