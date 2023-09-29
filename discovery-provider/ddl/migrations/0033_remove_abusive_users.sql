begin;
do $$ begin

-- prod gate
if exists (select * from "blocks" where "blockhash" = '0x8d5e6984014505e1e11bcbb1ca1a13bcc6ae85ac74014710a73271d82ca49f01') then
  perform clear_user_records(array[529079]);
end if;

end $$;
commit;