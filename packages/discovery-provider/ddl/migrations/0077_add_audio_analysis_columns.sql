begin;

alter table tracks
add column if not exists bpm float;
add column if not exists musical_key character varying,

commit;
