begin;
do $$ begin
-- stage gate
if exists (select * from "blocks" where "blockhash" = '0x65a3243860511ed28a933c3a113dea7df368ad53f721cc9d0034c0c75f996afb') then
  -- jump core indexing to the expected block
  insert into core_indexed_blocks (blockhash, parenthash, chain_id, height) values ('785C639441F9E93752B9E2E1639365C6EA84CFE2666C794FC4A7338E0F114563', '30D63285F13282AF09D0BD12FBBE9EA843D8FC874B40FD4E26B294B8AF76B204', 'audius-testnet-17', 11046) on conflict (blockhash) do nothing;

end if;
end $$;
commit;
