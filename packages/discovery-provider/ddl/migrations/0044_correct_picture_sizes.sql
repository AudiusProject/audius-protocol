update users
set cover_photo_sizes = regexp_replace(cover_photo_sizes, '.*content\/([^\/]+)\/.*', '\1', 'g'),
    profile_picture_sizes = regexp_replace(profile_picture_sizes, '.*content\/([^\/]+)\/.*', '\1', 'g')
where cover_photo_sizes like '%:%';
