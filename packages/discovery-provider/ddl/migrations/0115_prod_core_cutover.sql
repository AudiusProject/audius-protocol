begin;
do $$ begin
-- stage gate
if exists (select * from "blocks" where "blockhash" = '0x8d5e6984014505e1e11bcbb1ca1a13bcc6ae85ac74014710a73271d82ca49f01') then
  -- jump core indexing to the expected block
  insert into core_indexed_blocks (blockhash, parenthash, chain_id, height) 
  values (
    'FF712E9F69D1B86879C738826C8C0B4ECDD7DFDC9696310E3BFB0D6AFA0945E7', 
    '3B68D2046A9836FA374018F36CDDECE8DA1A02E0D1EEB5F1AC272056EFEC0004', 
    'audius-mainnet-alpha',
    113180
  ) 
  on conflict (chain_id, height) do nothing;
end if;
end $$;
commit;
