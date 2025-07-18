begin;

do $$
begin
    -- run only on stage
    if exists (select * from "blocks" where "blockhash" = 'ca5006c0cbdeaba38df71b834a7eaa3a6ccb2adcf76de282d71d6070d5ca5409') then
        INSERT INTO artist_coins (
            mint,
            user_id,
            ticker,
            decimals,
            created_at
        ) VALUES
            ('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', 704297499, 'BONK', 5, NOW())
        on conflict do nothing;
    end if;

end $$;

commit;

