-- +migrate Up
with duplicates as (
  select (min(rowid)) as keep_row, rowid
  from core_validators
  group by endpoint
  having count(*) > 1
)
delete from core_validators
where rowid in (
  select rowid from core_validators where rowid not in (select keep_row from duplicates)
);

alter table core_validators
add constraint unique_endpoint unique (endpoint);

-- +migrate Down
