begin;
do $$ begin
-- stage gate
if exists (select * from "blocks" where "blockhash" = '0x8d5e6984014505e1e11bcbb1ca1a13bcc6ae85ac74014710a73271d82ca49f01') then
  -- jump core indexing to the expected block
  insert into core_indexed_blocks (blockhash, parenthash, chain_id, height) 
  values (
    'TODO - get from chain', 
    'TODO - get from chain', 
    'audius-mainnet-alpha', 
    10000
  ) 
  on conflict (chain_id, height) do nothing;
end if;
end $$;
commit;
