import Database from 'better-sqlite3'
export const db = new Database('foobar.db')

db.pragma('journal_mode = WAL')

db.exec(`

create table if not exists releases (
  key text primary key,
  releaseCount integer,
  soundRecordingCount integer,
  imageCount integer,
  failureCount integer default 0
);

insert into releases (key) values ('asdf') on conflict do nothing;

`)

const rows = db.prepare('SELECT * from releases limit ?').bind(33).all()

console.log(rows)
