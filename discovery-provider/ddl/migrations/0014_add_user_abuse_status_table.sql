begin;

create table if not exists users_abuse_status (
  user_id integer primary key NOT NULL,
  is_blocked_from_relay boolean DEFAULT false NOT NULL,
  is_blocked_from_notifications boolean DEFAULT false NOT NULL,
  is_blocked_from_emails boolean DEFAULT false NOT NULL,
  applied_rules integer[],
);

commit;
