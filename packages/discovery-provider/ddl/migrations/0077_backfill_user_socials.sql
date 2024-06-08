begin;

-- do not run migration on prod
do $$
begin
    if exists (select * from "blocks" where "blockhash" = '0x8d5e6984014505e1e11bcbb1ca1a13bcc6ae85ac74014710a73271d82ca49f01') then
        return;
    end if;

    -- check whether the data has already been backfilled and return early if it has
    -- this is so that the migration is idempotent
    if exists (select 1 from users where website is not null) then
        return;
    end if;

    -- ========== USER SOCIALS BACKFILL ==========
    -- step 1: create a temporary table to hold the tsv data
    create temp table temp_user_socials_tsv_data (
        handle varchar primary key,
        twitterHandle varchar,
        instagramHandle varchar,
        tiktokHandle varchar,
        website varchar,
        donation varchar
    );

    -- step 2: copy the data from the tsv file into the temporary table
    copy temp_user_socials_tsv_data (handle, twitterHandle, instagramHandle, tiktokHandle, website, donation)
    from '../tsvs/stage/stage_user_socials.tsv'
    with (format csv, delimiter e'\t');

    -- step 3: update records in the user table based on the data in the temporary table
    -- twitter
    update users u
    set
        twitter_handle = temp.twitterHandle
    from temp_user_socials_tsv_data as temp
    where u.handle = temp.handle
    and u.is_current is true
    and u.twitter_handle is null and temp.twitterHandle is not null;

    -- instagram
    update users u
    set
        instagram_handle = temp.instagramHandle
    from temp_user_socials_tsv_data as temp
    where u.handle = temp.handle
    and u.is_current is true
    and u.instagram_handle is null and temp.instagramHandle is not null;

    -- tiktok
    update users u
    set
        tiktok_handle = temp.tiktokHandle
    from temp_user_socials_tsv_data as temp
    where u.handle = temp.handle
    and u.is_current is true
    and u.tiktok_handle is null and temp.tiktokHandle is not null;

    -- website
    update users u
    set
        website = temp.website
    from temp_user_socials_tsv_data as temp
    where u.handle = temp.handle
    and u.is_current is true
    and u.website is null and temp.website is not null;

    -- donation
    update users u
    set
        donation = temp.donation
    from temp_user_socials_tsv_data as temp
    where u.handle = temp.handle
    and u.is_current is true
    and u.donation is null and temp.donation is not null;

    -- step 4: drop the temporary table
    drop table temp_user_socials_tsv_data;
    -- ========== USER SOCIALS BACKFILL ==========


    -- ========== SOCIAL VERIFICATIONS BACKFILL ==========
    -- step 1: create temporary tables to hold the tsv data
    create temp table temp_verified_twitter_users_tsv_data (
        handle varchar primary key
    );

    create temp table temp_verified_instagram_users_tsv_data (
        handle varchar primary key
    );

    create temp table temp_verified_tiktok_users_tsv_data (
        handle varchar primary key
    );

    -- step 2: copy the data from the tsv files into the temporary tables
    copy temp_verified_twitter_users_tsv_data (handle)
    from '../tsvs/stage/stage_verified_twitter_users.tsv'
    with (format csv, delimiter e'\t');

    copy temp_verified_instagram_users_tsv_data (handle)
    from '../tsvs/stage/stage_verified_instagram_users.tsv'
    with (format csv, delimiter e'\t');

    copy temp_verified_tiktok_users_tsv_data (handle)
    from '../tsvs/stage/stage_verified_tiktok_users.tsv'
    with (format csv, delimiter e'\t');

    -- step 3: update records in the user table based on the data in the temporary tables
    update users u
    set
        verified_with_twitter = true,
        is_verified = true
    from temp_verified_twitter_users_tsv_data as temp
    where u.handle = temp.handle
    and u.is_current is true;

    update users u
    set
        verified_with_instagram = true,
        is_verified = true
    from temp_verified_instagram_users_tsv_data as temp
    where u.handle = temp.handle
    and u.is_current is true;

    update users u
    set
        verified_with_tiktok = true,
        is_verified = true
    from temp_verified_tiktok_users_tsv_data as temp
    where u.handle = temp.handle
    and u.is_current is true;

    -- step 4: drop the temporary tables
    drop table temp_verified_twitter_users_tsv_data;
    drop table temp_verified_instagram_users_tsv_data;
    drop table temp_verified_tiktok_users_tsv_data;

    -- ========== SOCIAL VERIFICATIONS BACKFILL ==========
end $$;

commit;
