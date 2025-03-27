create index if not exists ix_announcement on notification(type, timestamp) where type = 'announcement';
