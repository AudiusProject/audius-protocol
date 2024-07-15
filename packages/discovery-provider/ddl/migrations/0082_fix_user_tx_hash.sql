begin;
  do $$
  begin

  if exists (select * from "users" where "user_id" = 191315561 and "txhash" = '0x8ffd7a1ea4db74bd81476dfc0be79546aa5bfab282d9c6b19451267a5b66db39') then

    update "users" set "txhash" = '0xd1334c75993693196a312fe52a223197407dd7b4751ae669fe8e4cb119060047' where "user_id" = 191315561;

  end if;

end $$;

commit;