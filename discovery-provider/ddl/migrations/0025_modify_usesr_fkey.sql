-- for all tables with is_current
-- use a fkey constraint that cascades delete
-- delete is_current false
begin;

-- terminate all active queries to avoid
SELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE state = 'active' and pid <> pg_backend_pid();

LOCK TABLE users IN ACCESS EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION log_message(message_text text)
RETURNS void AS
$$
BEGIN
    RAISE NOTICE '% %', pg_backend_pid(), message_text;
END;
$$
LANGUAGE plpgsql;

SELECT log_message('creating new users table');

-- replace users
drop materialized view if exists trending_params;

alter table users drop constraint if exists users_blocknumber_fkey;
create table users_new (like users including all);
insert into users_new select * from users where is_current = true;

SELECT log_message('replacing old users table');

drop table users;
alter table users_new rename to users;
alter table users add constraint users_blocknumber_fkey foreign key (blocknumber) references blocks (number) on delete cascade;

-- re-enable triggers
CREATE TRIGGER trg_users AFTER INSERT OR UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE public.on_new_row();
CREATE TRIGGER on_user AFTER INSERT ON public.users FOR EACH ROW EXECUTE PROCEDURE public.handle_user();

SELECT log_message('recreate trending params');

select recreate_trending_params();
commit;