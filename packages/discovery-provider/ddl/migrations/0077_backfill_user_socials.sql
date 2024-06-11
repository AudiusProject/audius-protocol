begin;

do $$
begin
    -- run only on stage
    if exists (select * from "blocks" where "blockhash" = '0x65a3243860511ed28a933c3a113dea7df368ad53f721cc9d0034c0c75f996afb') then

        -- check whether the data has already been backfilled and return early for idempotency
        if exists (select 1 from users where website is not null) then
            return;
        end if;

        -- ========== USER SOCIALS BACKFILL ==========
        update users u
        set
            twitter_handle = temp.twitterHandle
        from temp_stage_user_socials as temp
        where u.handle = temp.handle
        and u.is_current is true
        and u.twitter_handle is null and temp.twitterHandle is not null;

        -- instagram
        update users u
        set
            instagram_handle = temp.instagramHandle
        from temp_stage_user_socials as temp
        where u.handle = temp.handle
        and u.is_current is true
        and u.instagram_handle is null and temp.instagramHandle is not null;

        -- tiktok
        update users u
        set
            tiktok_handle = temp.tiktokHandle
        from temp_stage_user_socials as temp
        where u.handle = temp.handle
        and u.is_current is true
        and u.tiktok_handle is null and temp.tiktokHandle is not null;

        -- website
        update users u
        set
            website = temp.website
        from temp_stage_user_socials as temp
        where u.handle = temp.handle
        and u.is_current is true
        and u.website is null and temp.website is not null;

        -- donation
        update users u
        set
            donation = temp.donation
        from temp_stage_user_socials as temp
        where u.handle = temp.handle
        and u.is_current is true
        and u.donation is null and temp.donation is not null;

        -- ========== SOCIAL VERIFICATIONS BACKFILL ==========
        update users u
        set
            verified_with_twitter = true,
            is_verified = true
        from temp_stage_verified_twitter_users as temp
        where u.handle = temp.handle
        and u.is_current is true;

        update users u
        set
            verified_with_instagram = true,
            is_verified = true
        from temp_stage_verified_instagram_users as temp
        where u.handle = temp.handle
        and u.is_current is true;

        update users u
        set
            verified_with_tiktok = true,
            is_verified = true
        from temp_stage_verified_tiktok_users as temp
        where u.handle = temp.handle
        and u.is_current is true;

    end if;

end $$;

commit;
