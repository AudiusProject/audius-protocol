-- porting over any semi-recent DMs migration from dbmate

create table if not exists chat_ban (
	user_id int not null primary key
);
