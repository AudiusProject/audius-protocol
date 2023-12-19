--
-- PostgreSQL database dump
--

-- Dumped from database version 11.17
-- Dumped by pg_dump version 14.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track execution statistics of all SQL statements executed';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: tsm_system_rows; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS tsm_system_rows WITH SCHEMA public;


--
-- Name: EXTENSION tsm_system_rows; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION tsm_system_rows IS 'TABLESAMPLE method which accepts number of rows as a limit';


--
-- Name: challengetype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.challengetype AS ENUM (
    'boolean',
    'numeric',
    'aggregate',
    'trending'
);


--
-- Name: reposttype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reposttype AS ENUM (
    'track',
    'playlist',
    'album'
);


--
-- Name: savetype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.savetype AS ENUM (
    'track',
    'playlist',
    'album'
);


--
-- Name: skippedtransactionlevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.skippedtransactionlevel AS ENUM (
    'node',
    'network'
);


--
-- Name: wallet_chain; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.wallet_chain AS ENUM (
    'eth',
    'sol'
);


--
-- Name: handle_challenge_disbursement(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_challenge_disbursement() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  reward_manager_tx reward_manager_txs%ROWTYPE;
begin

  select * into reward_manager_tx from reward_manager_txs where reward_manager_txs.signature = new.signature limit 1;
	
  if reward_manager_tx is not null then
	  -- create a notification for the challenge disbursement
	  insert into notification
		(slot, user_ids, timestamp, type, group_id, specifier, data)
	  values
		(
			new.slot,
			ARRAY [new.user_id],
			reward_manager_tx.created_at,
			'challenge_reward',
			'challenge_reward:' || new.user_id || ':challenge:' || new.challenge_id || ':specifier:' || new.specifier,
			new.user_id,
			json_build_object('specifier', new.specifier, 'challenge_id', new.challenge_id, 'amount', new.amount)
		)
	  on conflict do nothing;
  end if;
  return null;

exception
  when others then return null;
end;
$$;


--
-- Name: handle_follow(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_follow() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  new_follower_count int;
  milestone integer;
  delta int;
begin
  insert into aggregate_user (user_id) values (new.followee_user_id) on conflict do nothing;
  insert into aggregate_user (user_id) values (new.follower_user_id) on conflict do nothing;

  -- increment or decrement?
  if new.is_delete then
    delta := -1;
  else
    delta := 1;
  end if;

  update aggregate_user 
  set following_count = following_count + delta 
  where user_id = new.follower_user_id;

  update aggregate_user 
  set follower_count = follower_count + delta
  where user_id = new.followee_user_id
  returning follower_count into new_follower_count;

  -- create a milestone if applicable
  select new_follower_count into milestone where new_follower_count in (10, 25, 50, 100, 250, 500, 1000, 5000, 10000, 20000, 50000, 100000, 1000000);
  if milestone is not null and new.is_delete is false then
      insert into milestones 
        (id, name, threshold, blocknumber, slot, timestamp)
      values
        (new.followee_user_id, 'FOLLOWER_COUNT', milestone, new.blocknumber, new.slot, new.created_at)
      on conflict do nothing;
      insert into notification
        (user_ids, type, group_id, specifier, blocknumber, timestamp, data)
        values
        (
          ARRAY [new.followee_user_id],
          'milestone_follower_count',
          'milestone:FOLLOWER_COUNT:id:' || new.followee_user_id || ':threshold:' || milestone,
          new.followee_user_id,
          new.blocknumber,
          new.created_at,
          json_build_object('type', 'FOLLOWER_COUNT', 'user_id', new.followee_user_id, 'threshold', milestone)
        )
    on conflict do nothing;
  end if;

  begin
    -- create a notification for the followee
    if new.is_delete is false then
      insert into notification
      (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
      values
      (
        new.blocknumber,
        ARRAY [new.followee_user_id],
        new.created_at,
        'follow',
        new.follower_user_id,
        'follow:' || new.followee_user_id,
        json_build_object('followee_user_id', new.followee_user_id, 'follower_user_id', new.follower_user_id)
      )
      on conflict do nothing;
    end if;
	exception
		when others then null;
	end;

  return null;
end; 
$$;


--
-- Name: handle_play(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_play() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
    new_listen_count int;
    milestone int;
    owner_user_id int;
begin

    insert into aggregate_plays (play_item_id, count) values (new.play_item_id, 0) on conflict do nothing;

    update aggregate_plays
        set count = count + 1 
        where play_item_id = new.play_item_id
        returning count into new_listen_count;

    select new_listen_count 
        into milestone 
        where new_listen_count in (10,25,50,100,250,500,1000,5000,10000,20000,50000,100000,1000000);

    if milestone is not null then
        insert into milestones
            (id, name, threshold, slot, timestamp)
        values
            (new.play_item_id, 'LISTEN_COUNT', milestone, new.slot, new.created_at)
        on conflict do nothing;
        select tracks.owner_id into owner_user_id from tracks where is_current and track_id = new.play_item_id;
        if owner_user_id is not null then
            insert into notification
                (user_ids, specifier, group_id, type, slot, timestamp, data)
                values
                (
                    array[owner_user_id],
                    owner_user_id,
                    'milestone:LISTEN_COUNT:id:' || new.play_item_id || ':threshold:' || milestone,
                    'milestone',
                    new.slot,
                    new.created_at,
                    json_build_object('type', 'LISTEN_COUNT', 'track_id', new.play_item_id, 'threshold', milestone)
                )
            on conflict do nothing;
        end if;
    end if;
    return null;
end; 
$$;


--
-- Name: handle_playlist(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_playlist() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  track_owner_id int := 0;
  track_item json;
  subscriber_user_ids integer[];
  old_row playlists%rowtype := null;
  delta int := 0;
begin

  insert into aggregate_user (user_id) values (new.playlist_owner_id) on conflict do nothing;
  insert into aggregate_playlist (playlist_id, is_album) values (new.playlist_id, new.is_album) on conflict do nothing;

  select * into old_row from playlists where playlist_id = new.playlist_id and is_current = false order by blocknumber desc limit 1;

  delta := 0;
  if (new.is_delete = true and new.is_current = true) and (old_row.is_delete = false and old_row.is_private = false) then
    delta := -1;
  end if;

  if (old_row is null and new.is_private = false) or (old_row.is_private = true and new.is_private = false) then
    delta := 1;
  end if;

  if delta != 0 then
    if new.is_album then
      update aggregate_user 
      set album_count = album_count + delta
      where user_id = new.playlist_owner_id;
    else
      update aggregate_user 
      set playlist_count = playlist_count + delta
      where user_id = new.playlist_owner_id;
    end if;
  end if;
  -- Create playlist notification
  begin
    if new.is_private = FALSE AND 
    new.is_delete = FALSE AND
    (
      new.created_at = new.updated_at OR
      old_row.is_private = TRUE
    )
    then
      select array(
        select subscriber_id 
          from subscriptions 
          where is_current and 
          not is_delete and 
          user_id=new.playlist_owner_id
      ) into subscriber_user_ids;
      if array_length(subscriber_user_ids, 1)	> 0 then
        insert into notification
        (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
        values
        (
          new.blocknumber,
          subscriber_user_ids,
          new.updated_at,
          'create',
          new.playlist_owner_id,
          'create:playlist_id:' || new.playlist_id,
          json_build_object('playlist_id', new.playlist_id, 'is_album', new.is_album)
        )
        on conflict do nothing;
      end if;
    end if;
	exception
		when others then null;
	end;

  begin
    if new.is_delete IS FALSE and new.is_private IS FALSE then
      for track_item IN select jsonb_array_elements from jsonb_array_elements(new.playlist_contents -> 'track_ids')
      loop
        if (track_item->>'time')::double precision::int >= extract(epoch from new.updated_at)::int then
          select owner_id into track_owner_id from tracks where is_current and track_id=(track_item->>'track')::int;
          if track_owner_id != new.playlist_owner_id then
            insert into notification
              (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
              values
              (
                new.blocknumber,
                ARRAY [track_owner_id],
                new.updated_at,
                'track_added_to_playlist',
                track_owner_id,
                'track_added_to_playlist:playlist_id:' || new.playlist_id || ':track_id:' || (track_item->>'track')::int || ':blocknumber:' || new.blocknumber,
                json_build_object('track_id', (track_item->>'track')::int, 'playlist_id', new.playlist_id, 'playlist_owner_id', new.playlist_owner_id)
              )
            on conflict do nothing;
          end if;
        end if;
      end loop;
    end if;
   exception
     when others then null;
   end;

  return null;
end;
$$;


--
-- Name: handle_reaction(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_reaction() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  tip_row notification%ROWTYPE;
  tip_sender_user_id int;
  tip_receiver_user_id int;
  tip_amount bigint;
begin

  raise NOTICE 'start';
  
  if new.reaction_type = 'tip' then

    raise NOTICE 'is tip';

    SELECT amount, sender_user_id, receiver_user_id 
    INTO tip_amount, tip_sender_user_id, tip_receiver_user_id 
    FROM user_tips ut 
    WHERE ut.signature = new.reacted_to;
    
    raise NOTICE 'did select % %', tip_sender_user_id, tip_receiver_user_id;
    raise NOTICE 'did select %', new.reacted_to;

    IF tip_sender_user_id IS NOT NULL AND tip_receiver_user_id IS NOT NULL THEN
      raise NOTICE 'have ids';

      if new.reaction_value != 0 then
        INSERT INTO notification
          (slot, user_ids, timestamp, type, specifier, group_id, data)
        VALUES
          (
          new.slot,
          ARRAY [tip_sender_user_id],
          new.timestamp,
          'reaction',
          tip_receiver_user_id,
          'reaction:' || 'reaction_to:' || new.reacted_to || ':reaction_type:' || new.reaction_type || ':reaction_value:' || new.reaction_value,
          json_build_object(
            'sender_wallet', new.sender_wallet,
            'reaction_type', new.reaction_type,
            'reacted_to', new.reacted_to,
            'reaction_value', new.reaction_value,
            'receiver_user_id', tip_receiver_user_id,
            'sender_user_id', tip_sender_user_id,
            'tip_amount', tip_amount::varchar(255)
          )
        )
        on conflict do nothing;
      end if;

      -- find the notification for tip send - update the data to include reaction value
      UPDATE notification
      SET data = jsonb_set(data, '{reaction_value}', new.reaction_value::text::jsonb)
      WHERE notification.group_id = 'tip_receive:user_id:' || tip_receiver_user_id || ':signature:' || new.reacted_to;
    end if;
  end if;

  return null;

exception
  when others then return null;
end;
$$;


--
-- Name: handle_repost(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_repost() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  new_val int;
  milestone_name text;
  milestone integer;
  owner_user_id int;
  track_remix_of json;
  is_remix_cosign boolean;
  delta int;
  entity_type text;
begin

  insert into aggregate_user (user_id) values (new.user_id) on conflict do nothing;
  if new.repost_type = 'track' then
    insert into aggregate_track (track_id) values (new.repost_item_id) on conflict do nothing;

    entity_type := 'track';
  else
    insert into aggregate_playlist (playlist_id, is_album) values (new.repost_item_id, new.repost_type = 'album') on conflict do nothing;

    entity_type := 'playlist';
  end if;

  -- increment or decrement?
  if new.is_delete then
    delta := -1;
  else
    delta := 1;
  end if;

  -- update agg user
  update aggregate_user 
  set repost_count = repost_count + delta
  where user_id = new.user_id;

  -- update agg track or playlist
  if new.repost_type = 'track' then
    milestone_name := 'TRACK_REPOST_COUNT';
    update aggregate_track 
    set repost_count = repost_count + delta
    where track_id = new.repost_item_id
    returning repost_count into new_val;
  	if new.is_delete IS FALSE then
		  select tracks.owner_id, tracks.remix_of into owner_user_id, track_remix_of from tracks where is_current and track_id = new.repost_item_id;
	  end if;
  else
    milestone_name := 'PLAYLIST_REPOST_COUNT';
    update aggregate_playlist
    set repost_count = repost_count + delta
    where playlist_id = new.repost_item_id
    returning repost_count into new_val;

  	if new.is_delete IS FALSE then
		  select playlist_owner_id into owner_user_id from playlists where is_current and playlist_id = new.repost_item_id;
	  end if;
  end if;

  -- create a milestone if applicable
  select new_val into milestone where new_val in (10, 25, 50, 100, 250, 500, 1000, 5000, 10000, 20000, 50000, 100000, 1000000);
  if new.is_delete = false and milestone is not null and owner_user_id is not null then
    insert into milestones 
      (id, name, threshold, blocknumber, slot, timestamp)
    values
      (new.repost_item_id, milestone_name, milestone, new.blocknumber, new.slot, new.created_at)
    on conflict do nothing;
    insert into notification
      (user_ids, type, specifier, group_id, blocknumber, timestamp, data)
      values
      (
        ARRAY [owner_user_id],
        'milestone',
        owner_user_id,
        'milestone:' || milestone_name  || ':id:' || new.repost_item_id || ':threshold:' || milestone,
        new.blocknumber,
        new.created_at,
        json_build_object('type', milestone_name, entity_type || '_id', new.repost_item_id, 'threshold', milestone)
      )
      on conflict do nothing;
  end if;

  begin
    -- create a notification for the reposted content's owner
    if new.is_delete is false then
    insert into notification
      (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
      values
      (
        new.blocknumber,
        ARRAY [owner_user_id],
        new.created_at,
        'repost',
        new.user_id,
        'repost:' || new.repost_item_id || ':type:'|| new.repost_type,
        json_build_object('repost_item_id', new.repost_item_id, 'user_id', new.user_id, 'type', new.repost_type)
      )
      on conflict do nothing;
    end if;

	-- notify followees of the reposter who have reposted the same content
	-- within the last month
	if new.is_delete is false
	and new.is_repost_of_repost is true then
	with
	    followee_repost_of_repost_ids as (
	        select user_id
	        from reposts r
	        where
	            r.repost_item_id = new.repost_item_id
	            and new.created_at - INTERVAL '1 month' < r.created_at
	            and new.created_at > r.created_at
              and r.is_delete is false
              and r.is_current is true
	            and r.user_id in (
	                select
	                    followee_user_id
	                from follows
	                where
	                    follower_user_id = new.user_id
                      and is_delete is false
                      and is_current is true
	            )
	    )
	insert into notification
		(blocknumber, user_ids, timestamp, type, specifier, group_id, data)
		SELECT blocknumber_val, user_ids_val, timestamp_val, type_val, specifier_val, group_id_val, data_val
		FROM (
			SELECT new.blocknumber AS blocknumber_val,
			ARRAY(
				SELECT user_id
				FROM
					followee_repost_of_repost_ids
			) AS user_ids_val,
			new.created_at AS timestamp_val,
			'repost_of_repost' AS type_val,
			new.user_id AS specifier_val,
			'repost_of_repost:' || new.repost_item_id || ':type:' || new.repost_type AS group_id_val,
			json_build_object(
				'repost_of_repost_item_id',
				new.repost_item_id,
				'user_id',
				new.user_id,
				'type',
				new.repost_type
			) AS data_val
		) sub
		WHERE user_ids_val IS NOT NULL AND array_length(user_ids_val, 1) > 0
		on conflict do nothing;
	end if;

    -- create a notification for remix cosign
    if new.is_delete is false and new.repost_type = 'track' and track_remix_of is not null then
      select
        case when tracks.owner_id = new.user_id then TRUE else FALSE end as boolean into is_remix_cosign
        from tracks
        where is_current and track_id = (track_remix_of->'tracks'->0->>'parent_track_id')::int;
      if is_remix_cosign then
        insert into notification
          (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
          values
          (
            new.blocknumber,
            ARRAY [owner_user_id],
            new.created_at,
            'cosign',
            new.user_id,
            'cosign:parent_track' || (track_remix_of->'tracks'->0->>'parent_track_id')::int || ':original_track:'|| new.repost_item_id,
            json_build_object('parent_track_id', (track_remix_of->'tracks'->0->>'parent_track_id')::int, 'track_id', new.repost_item_id, 'track_owner_id', owner_user_id)
          )
        on conflict do nothing;
      end if;
    end if;

	exception
		when others then null;
	end;

  return null;
end;
$$;


--
-- Name: handle_save(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_save() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  new_val int;
  milestone_name text;
  milestone integer;
  owner_user_id int;
  track_remix_of json;
  is_remix_cosign boolean;
  delta int;
  entity_type text;
begin

  insert into aggregate_user (user_id) values (new.user_id) on conflict do nothing;
  if new.save_type = 'track' then
    insert into aggregate_track (track_id) values (new.save_item_id) on conflict do nothing;

    entity_type := 'track';
  else
    insert into aggregate_playlist (playlist_id, is_album) values (new.save_item_id, new.save_type = 'album') on conflict do nothing;
    
    entity_type := 'playlist';
  end if;

  -- increment or decrement?
  if new.is_delete then
    delta := -1;
  else
    delta := 1;
  end if;

  -- update agg track or playlist
  if new.save_type = 'track' then
    milestone_name := 'TRACK_SAVE_COUNT';

  update
    aggregate_track
    set save_count = save_count + delta
  where
    track_id = new.save_item_id
  returning
    save_count into new_val;


    -- update agg user
    update
      aggregate_user
    set track_save_count = track_save_count + delta
    where
      user_id = new.user_id;

  	if new.is_delete IS FALSE then
		  select tracks.owner_id, tracks.remix_of into owner_user_id, track_remix_of from tracks where is_current and track_id = new.save_item_id;
	  end if;
  else
    milestone_name := 'PLAYLIST_SAVE_COUNT';

    update aggregate_playlist
    set save_count = save_count + delta
    where playlist_id = new.save_item_id
    returning save_count into new_val;

    if new.is_delete IS FALSE then
		  select playlists.playlist_owner_id into owner_user_id from playlists where is_current and playlist_id = new.save_item_id;
	  end if;

  end if;

  -- create a milestone if applicable
  select new_val into milestone where new_val in (10, 25, 50, 100, 250, 500, 1000, 5000, 10000, 20000, 50000, 100000, 1000000);
  if new.is_delete = false and milestone is not null then
    insert into milestones 
      (id, name, threshold, blocknumber, slot, timestamp)
    values
      (new.save_item_id, milestone_name, milestone, new.blocknumber, new.slot, new.created_at)
    on conflict do nothing;
    insert into notification
      (user_ids, type, specifier, group_id, blocknumber, timestamp, data)
      values
      (
        ARRAY [owner_user_id],
        'milestone',
        owner_user_id,
        'milestone:' || milestone_name  || ':id:' || new.save_item_id || ':threshold:' || milestone,
        new.blocknumber,
        new.created_at,
        json_build_object('type', milestone_name, entity_type || '_id', new.save_item_id, 'threshold', milestone)
      )
      on conflict do nothing;
  end if;

  begin
    -- create a notification for the saved content's owner
    if new.is_delete is false then
      insert into notification
        (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
        values
        ( 
          new.blocknumber,
          ARRAY [owner_user_id], 
          new.created_at, 
          'save',
          new.user_id,
          'save:' || new.save_item_id || ':type:'|| new.save_type,
          json_build_object('save_item_id', new.save_item_id, 'user_id', new.user_id, 'type', new.save_type)
        )
      on conflict do nothing;
    end if;

    -- notify followees of the favoriter who have reposted the same content
    -- within the last month
    if new.is_delete is false
    and new.is_save_of_repost is true then
    with
        followee_save_repost_ids as (
            select user_id
            from reposts r
            where
                r.repost_item_id = new.save_item_id
                and new.created_at - INTERVAL '1 month' < r.created_at
                and new.created_at > r.created_at
                and r.is_delete is false
                and r.is_current is true
                and r.repost_type::text = new.save_type::text
                and r.user_id in
                (
                    select
                        followee_user_id
                    from follows
                    where
                        follower_user_id = new.user_id
                        and is_delete is false
                        and is_current is true
                )
        )
    insert into notification
      (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
      SELECT blocknumber_val, user_ids_val, timestamp_val, type_val, specifier_val, group_id_val, data_val
      FROM (
        SELECT new.blocknumber AS blocknumber_val,
        ARRAY(
          SELECT user_id
          FROM
            followee_save_repost_ids
        ) AS user_ids_val,
        new.created_at AS timestamp_val,
        'save_of_repost' AS type_val,
        new.user_id AS specifier_val,
        'save_of_repost:' || new.save_item_id || ':type:' || new.save_type AS group_id_val,
        json_build_object(
          'save_of_repost_item_id',
          new.save_item_id,
          'user_id',
          new.user_id,
          'type',
          new.save_type
        ) AS data_val
      ) sub
      WHERE user_ids_val IS NOT NULL AND array_length(user_ids_val, 1) > 0
      on conflict do nothing;
    end if;

    -- create a notification for remix cosign
    if new.is_delete is false and new.save_type = 'track' and track_remix_of is not null then
      select
        case when tracks.owner_id = new.user_id then TRUE else FALSE end as boolean into is_remix_cosign
        from tracks 
        where is_current and track_id = (track_remix_of->'tracks'->0->>'parent_track_id')::int;
      if is_remix_cosign then
        insert into notification
          (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
          values
          ( 
            new.blocknumber,
            ARRAY [owner_user_id], 
            new.created_at, 
            'cosign',
            new.user_id,
            'cosign:parent_track' || (track_remix_of->'tracks'->0->>'parent_track_id')::int || ':original_track:'|| new.save_item_id,
            json_build_object('parent_track_id', (track_remix_of->'tracks'->0->>'parent_track_id')::int, 'track_id', new.save_item_id, 'track_owner_id', owner_user_id)
          )
        on conflict do nothing;
      end if;
    end if;
  exception
    when others then return null;
  end;

  return null;
end; 
$$;


--
-- Name: handle_supporter_rank_up(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_supporter_rank_up() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  user_bank_tx user_bank_txs%ROWTYPE;
  dethroned_user_id int;
begin
  select * into user_bank_tx from user_bank_txs where user_bank_txs.slot = new.slot limit 1;

  if user_bank_tx is not null then
    -- create a notification for the sender and receiver
    insert into notification
      (slot, user_ids, timestamp, type, specifier, group_id, data, type_v2)
    values
      (
      -- supporting_rank_up notifs are sent to the sender of the tip
        new.slot,
        ARRAY [new.sender_user_id],
        user_bank_tx.created_at,
        'supporting_rank_up',
        new.sender_user_id,
        'supporting_rank_up:' || new.rank || ':slot:' || new.slot,
        json_build_object('sender_user_id', new.sender_user_id, 'receiver_user_id', new.receiver_user_id, 'rank', new.rank),
        'supporting_rank_up'
      ),
      (
      -- supporter_rank_up notifs are sent to the receiver of the tip
        new.slot,
        ARRAY [new.receiver_user_id],
        user_bank_tx.created_at,
        'supporter_rank_up',
        new.receiver_user_id,
        'supporter_rank_up:' || new.rank || ':slot:' || new.slot,
        json_build_object('sender_user_id', new.sender_user_id, 'receiver_user_id', new.receiver_user_id, 'rank', new.rank),
        'supporter_rank_up'
      )
    on conflict do nothing;

    if new.rank = 1 then
      select sender_user_id into dethroned_user_id from supporter_rank_ups where rank=1 and receiver_user_id=new.receiver_user_id and slot < new.slot order by slot desc limit 1;
      if dethroned_user_id is not NULL then
        -- create a notification for the sender and receiver
        insert into notification
          (slot, user_ids, timestamp, type, specifier, group_id, data, type_v2)
        values
          (
            new.slot,
            ARRAY [dethroned_user_id],
            user_bank_tx.created_at,
            'supporter_dethroned',
            new.sender_user_id,
            'supporter_dethroned:receiver_user_id:' || new.receiver_user_id || ':slot:' || new.slot,
            json_build_object('sender_user_id', new.sender_user_id, 'receiver_user_id', new.receiver_user_id, 'dethroned_user_id', dethroned_user_id),
            'supporter_dethroned'
          ) on conflict do nothing;

      end if;
    end if;

  end if;
  return null;

exception
  when others then return null;
end;
$$;


--
-- Name: handle_track(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_track() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  old_row tracks%ROWTYPE;
  is_new_upload boolean;
  new_val int;
  delta int := 0;
  parent_track_owner_id int;
  subscriber_user_ids int[];
begin
  insert into aggregate_track (track_id) values (new.track_id) on conflict do nothing;
  insert into aggregate_user (user_id) values (new.owner_id) on conflict do nothing;

  -- typical "track edits" will mark old row is_current = false and insert a new row
  -- so find the old_row here:
  select * into old_row from tracks where track_id = new.track_id and is_current = false order by blocknumber desc limit 1;

  -- but there are some places where we do an "in place" update (like update is_available to false)
  if TG_OP = 'UPDATE' then
    old_row := OLD;
  elsif new.created_at = new.updated_at AND TG_OP = 'INSERT' then
    is_new_upload := true;
  end if;


  -- update aggregate_user.track_count
  if old_row.track_id is not null then
    -- making existing track private: decrement
    if track_is_public(old_row) and not track_is_public(new) then
      delta := -1;
    end if;

    -- making existing track public: increment
    if not track_is_public(old_row) and track_is_public(new) then
      delta := 1;
    end if;
  elsif is_new_upload and track_is_public(new) then
    -- new public track added: increment
    delta := 1;
  end if;

  update aggregate_user
    set track_count = track_count + delta
  where user_id = new.owner_id
  ;

  -- If new track or newly unlisted track, create notification
  begin
    if delta = 1 AND new.is_playlist_upload = FALSE THEN
      select array(
        select subscriber_id
          from subscriptions
          where is_current and
          not is_delete and
          user_id=new.owner_id
      ) into subscriber_user_ids;

      if array_length(subscriber_user_ids, 1)	> 0 then
        insert into notification
          (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
        values
        (
          new.blocknumber,
          subscriber_user_ids,
          new.updated_at,
          'create',
          new.track_id,
          'create:track:user_id:' || new.owner_id,
          json_build_object('track_id', new.track_id)
        )
        on conflict do nothing;
      end if;
    end if;
	exception
		when others then null;
	end;

  -- If new remix or newly unlisted remix, create notification
  begin
    if delta = 1 AND new.remix_of is not null THEN
      select owner_id into parent_track_owner_id from tracks where is_current and track_id = (new.remix_of->'tracks'->0->>'parent_track_id')::int limit 1;
      if parent_track_owner_id is not null then
        insert into notification
        (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
        values
        (
          new.blocknumber,
          ARRAY [parent_track_owner_id],
          new.updated_at,
          'remix',
          new.owner_id,
          'remix:track:' || new.track_id || ':parent_track:' || (new.remix_of->'tracks'->0->>'parent_track_id')::int || ':blocknumber:' || new.blocknumber,
          json_build_object('track_id', new.track_id, 'parent_track_id', (new.remix_of->'tracks'->0->>'parent_track_id')::int)
        )
        on conflict do nothing;
      end if;
    end if;
	exception
		when others then null;
	end;

  return null;
end;
$$;


--
-- Name: handle_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_user() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
begin
  insert into aggregate_user (user_id) values (new.user_id) on conflict do nothing;
  return null;
end;
$$;


--
-- Name: handle_user_balance_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_user_balance_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  new_val int;
  new_tier text;
  new_tier_value int;
  previous_tier text;
  previous_tier_value int;
begin
  SELECT label, val into new_tier, new_tier_value
  FROM (
    VALUES ('bronze', 10::bigint), ('silver', 100::bigint), ('gold', 10000::bigint), ('platinum', 100000::bigint)
  ) as tier (label, val)
  WHERE
    substr(new.current_balance, 1, GREATEST(1, length(new.current_balance) - 18))::bigint >= tier.val
  ORDER BY 
    tier.val DESC
  limit 1;

  SELECT label, val into previous_tier, previous_tier_value
  FROM (
    VALUES ('bronze', 10::bigint), ('silver', 100::bigint), ('gold', 10000::bigint), ('platinum', 100000::bigint)
  ) as tier (label, val)
  WHERE
    substr(new.previous_balance, 1, GREATEST(1, length(new.previous_balance) - 18))::bigint >= tier.val
  ORDER BY 
    tier.val DESC
  limit 1;

  -- create a notification if the tier changes
  if new_tier_value > previous_tier_value or (new_tier_value is not NULL and previous_tier_value is NULL) then
    insert into notification
      (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
    values
      ( 
        new.blocknumber,
        ARRAY [new.user_id], 
        new.updated_at, 
        'tier_change',
        new.user_id,
        'tier_change:user_id:' || new.user_id ||  ':tier:' || new_tier || ':blocknumber:' || new.blocknumber,
        json_build_object(
          'new_tier', new_tier,
          'new_tier_value', new_tier_value,
          'current_value', new.current_balance
        )
      )
    on conflict do nothing;
    return null;
  end if;

  return null;
exception
  when others then return null;
end;
$$;


--
-- Name: handle_user_tip(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_user_tip() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin

  -- create a notification for the sender and receiver
  insert into notification
    (slot, user_ids, timestamp, type, specifier, group_id, data)
  values
    ( 
      new.slot,
      ARRAY [new.receiver_user_id], 
      new.created_at, 
      'tip_receive',
      new.receiver_user_id,
      'tip_receive:user_id:' || new.receiver_user_id || ':signature:' || new.signature,
      json_build_object(
        'sender_user_id', new.sender_user_id,
        'receiver_user_id', new.receiver_user_id,
        'amount', new.amount,
        'tx_signature', new.signature
      )
    ),
    ( 
      new.slot,
      ARRAY [new.sender_user_id], 
      new.created_at, 
      'tip_send',
      new.sender_user_id,
      'tip_send:user_id:' || new.sender_user_id || ':signature:' || new.signature,
      json_build_object(
        'sender_user_id', new.sender_user_id,
        'receiver_user_id', new.receiver_user_id,
        'amount', new.amount,
        'tx_signature', new.signature
      )
    )
    on conflict do nothing;
  return null;
exception
  when others then return null;
return null;
end;
$$;


--
-- Name: on_new_row(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.on_new_row() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  case TG_TABLE_NAME
    when 'tracks' then
      PERFORM pg_notify(TG_TABLE_NAME, json_build_object('track_id', new.track_id)::text);
    when 'users' then
      PERFORM pg_notify(TG_TABLE_NAME, json_build_object('user_id', new.user_id)::text);
    when 'playlists' then
      PERFORM pg_notify(TG_TABLE_NAME, json_build_object('playlist_id', new.playlist_id)::text);
    else
      PERFORM pg_notify(TG_TABLE_NAME, to_json(new)::text);
  end case;
  return null;
end; 
$$;


--
-- Name: table_has_column(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.table_has_column(text, text) RETURNS boolean
    LANGUAGE sql
    AS $_$
  SELECT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2)
$_$;


--
-- Name: table_has_constraint(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.table_has_constraint(text, text) RETURNS boolean
    LANGUAGE sql
    AS $_$
  SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = $1::regclass AND conname = $2)
$_$;


--
-- Name: to_date_safe(character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.to_date_safe(p_date character varying, p_format character varying) RETURNS date
    LANGUAGE plpgsql
    AS $$
        DECLARE
            ret_date DATE;
        BEGIN
            IF p_date = '' THEN
                RETURN NULL;
            END IF;
            RETURN to_date( p_date, p_format );
        EXCEPTION
        WHEN others THEN
            RETURN null;
        END;
        $$;


--
-- Name: to_timestamp_safe(character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.to_timestamp_safe(p_timestamp character varying, p_format character varying) RETURNS timestamp without time zone
    LANGUAGE plpgsql
    AS $$
  DECLARE
      ret_timestamp TIMESTAMP;
  BEGIN
      IF p_timestamp = '' THEN
          RETURN NULL;
      END IF;
      RETURN to_timestamp( p_timestamp, p_format );
  EXCEPTION
  WHEN others THEN
      RETURN null;
  END;
  $$;


--
-- Name: track_is_public(record); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_is_public(track record) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
begin
  return track.is_unlisted = false
     and track.is_available = true
     and track.is_delete = false
     and track.stem_of is null;
end
$$;


--
-- Name: audius_ts_dict; Type: TEXT SEARCH DICTIONARY; Schema: public; Owner: -
--

CREATE TEXT SEARCH DICTIONARY public.audius_ts_dict (
    TEMPLATE = pg_catalog.simple );


--
-- Name: audius_ts_config; Type: TEXT SEARCH CONFIGURATION; Schema: public; Owner: -
--

CREATE TEXT SEARCH CONFIGURATION public.audius_ts_config (
    PARSER = pg_catalog."default" );

ALTER TEXT SEARCH CONFIGURATION public.audius_ts_config
    ADD MAPPING FOR asciiword WITH public.audius_ts_dict;

ALTER TEXT SEARCH CONFIGURATION public.audius_ts_config
    ADD MAPPING FOR word WITH public.audius_ts_dict;

ALTER TEXT SEARCH CONFIGURATION public.audius_ts_config
    ADD MAPPING FOR numword WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.audius_ts_config
    ADD MAPPING FOR email WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.audius_ts_config
    ADD MAPPING FOR url WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.audius_ts_config
    ADD MAPPING FOR host WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.audius_ts_config
    ADD MAPPING FOR sfloat WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.audius_ts_config
    ADD MAPPING FOR version WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.audius_ts_config
    ADD MAPPING FOR hword_numpart WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.audius_ts_config
    ADD MAPPING FOR hword_part WITH public.audius_ts_dict;

ALTER TEXT SEARCH CONFIGURATION public.audius_ts_config
    ADD MAPPING FOR hword_asciipart WITH public.audius_ts_dict;

ALTER TEXT SEARCH CONFIGURATION public.audius_ts_config
    ADD MAPPING FOR numhword WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.audius_ts_config
    ADD MAPPING FOR asciihword WITH public.audius_ts_dict;

ALTER TEXT SEARCH CONFIGURATION public.audius_ts_config
    ADD MAPPING FOR hword WITH public.audius_ts_dict;

ALTER TEXT SEARCH CONFIGURATION public.audius_ts_config
    ADD MAPPING FOR url_path WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.audius_ts_config
    ADD MAPPING FOR file WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.audius_ts_config
    ADD MAPPING FOR "float" WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.audius_ts_config
    ADD MAPPING FOR "int" WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.audius_ts_config
    ADD MAPPING FOR uint WITH simple;


SET default_tablespace = '';

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


--
-- Name: aggregate_daily_app_name_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aggregate_daily_app_name_metrics (
    id integer NOT NULL,
    application_name character varying NOT NULL,
    count integer NOT NULL,
    "timestamp" date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: aggregate_daily_app_name_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.aggregate_daily_app_name_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aggregate_daily_app_name_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.aggregate_daily_app_name_metrics_id_seq OWNED BY public.aggregate_daily_app_name_metrics.id;


--
-- Name: aggregate_daily_total_users_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aggregate_daily_total_users_metrics (
    id integer NOT NULL,
    count integer NOT NULL,
    "timestamp" date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: aggregate_daily_total_users_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.aggregate_daily_total_users_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aggregate_daily_total_users_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.aggregate_daily_total_users_metrics_id_seq OWNED BY public.aggregate_daily_total_users_metrics.id;


--
-- Name: aggregate_daily_unique_users_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aggregate_daily_unique_users_metrics (
    id integer NOT NULL,
    count integer NOT NULL,
    "timestamp" date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    summed_count integer
);


--
-- Name: aggregate_daily_unique_users_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.aggregate_daily_unique_users_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aggregate_daily_unique_users_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.aggregate_daily_unique_users_metrics_id_seq OWNED BY public.aggregate_daily_unique_users_metrics.id;


--
-- Name: plays; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plays (
    id integer NOT NULL,
    user_id integer,
    source character varying,
    play_item_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    slot integer,
    signature character varying,
    city character varying,
    region character varying,
    country character varying
);


--
-- Name: tracks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tracks (
    blockhash character varying,
    track_id integer NOT NULL,
    is_current boolean NOT NULL,
    is_delete boolean NOT NULL,
    owner_id integer NOT NULL,
    title text,
    length integer,
    cover_art character varying,
    tags character varying,
    genre character varying,
    mood character varying,
    credits_splits character varying,
    create_date character varying,
    release_date character varying,
    file_type character varying,
    metadata_multihash character varying,
    blocknumber integer,
    track_segments jsonb NOT NULL,
    created_at timestamp without time zone NOT NULL,
    description character varying,
    isrc character varying,
    iswc character varying,
    license character varying,
    updated_at timestamp without time zone NOT NULL,
    cover_art_sizes character varying,
    download jsonb,
    is_unlisted boolean DEFAULT false NOT NULL,
    field_visibility jsonb,
    route_id character varying,
    stem_of jsonb,
    remix_of jsonb,
    txhash character varying DEFAULT ''::character varying NOT NULL,
    slot integer,
    is_available boolean DEFAULT true NOT NULL,
    is_premium boolean DEFAULT false NOT NULL,
    premium_conditions jsonb,
    track_cid character varying,
    is_playlist_upload boolean DEFAULT false NOT NULL,
    duration integer DEFAULT 0,
    ai_attribution_user_id integer
    parent_album_ids number[]
);


--
-- Name: aggregate_interval_plays; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.aggregate_interval_plays AS
 SELECT tracks.track_id,
    tracks.genre,
    tracks.created_at,
    COALESCE(week_listen_counts.count, (0)::bigint) AS week_listen_counts,
    COALESCE(month_listen_counts.count, (0)::bigint) AS month_listen_counts
   FROM ((public.tracks
     LEFT JOIN ( SELECT plays.play_item_id,
            count(plays.id) AS count
           FROM public.plays
          WHERE (plays.created_at > (now() - '7 days'::interval))
          GROUP BY plays.play_item_id) week_listen_counts ON ((week_listen_counts.play_item_id = tracks.track_id)))
     LEFT JOIN ( SELECT plays.play_item_id,
            count(plays.id) AS count
           FROM public.plays
          WHERE (plays.created_at > (now() - '1 mon'::interval))
          GROUP BY plays.play_item_id) month_listen_counts ON ((month_listen_counts.play_item_id = tracks.track_id)))
  WHERE ((tracks.is_current IS TRUE) AND (tracks.is_delete IS FALSE) AND (tracks.is_unlisted IS FALSE) AND (tracks.stem_of IS NULL))
  WITH NO DATA;


--
-- Name: aggregate_monthly_app_name_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aggregate_monthly_app_name_metrics (
    id integer NOT NULL,
    application_name character varying NOT NULL,
    count integer NOT NULL,
    "timestamp" date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: aggregate_monthly_app_name_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.aggregate_monthly_app_name_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aggregate_monthly_app_name_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.aggregate_monthly_app_name_metrics_id_seq OWNED BY public.aggregate_monthly_app_name_metrics.id;


--
-- Name: aggregate_monthly_plays; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aggregate_monthly_plays (
    play_item_id integer NOT NULL,
    "timestamp" date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    count integer NOT NULL
);


--
-- Name: aggregate_monthly_total_users_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aggregate_monthly_total_users_metrics (
    id integer NOT NULL,
    count integer NOT NULL,
    "timestamp" date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: aggregate_monthly_total_users_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.aggregate_monthly_total_users_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aggregate_monthly_total_users_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.aggregate_monthly_total_users_metrics_id_seq OWNED BY public.aggregate_monthly_total_users_metrics.id;


--
-- Name: aggregate_monthly_unique_users_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aggregate_monthly_unique_users_metrics (
    id integer NOT NULL,
    count integer NOT NULL,
    "timestamp" date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    summed_count integer
);


--
-- Name: aggregate_monthly_unique_users_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.aggregate_monthly_unique_users_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aggregate_monthly_unique_users_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.aggregate_monthly_unique_users_metrics_id_seq OWNED BY public.aggregate_monthly_unique_users_metrics.id;


--
-- Name: aggregate_playlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aggregate_playlist (
    playlist_id integer NOT NULL,
    is_album boolean,
    repost_count integer DEFAULT 0,
    save_count integer DEFAULT 0
);


--
-- Name: aggregate_plays; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aggregate_plays (
    play_item_id integer NOT NULL,
    count bigint
);


--
-- Name: aggregate_track; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aggregate_track (
    track_id integer NOT NULL,
    repost_count integer DEFAULT 0 NOT NULL,
    save_count integer DEFAULT 0 NOT NULL
);


--
-- Name: aggregate_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aggregate_user (
    user_id integer NOT NULL,
    track_count bigint DEFAULT 0,
    playlist_count bigint DEFAULT 0,
    album_count bigint DEFAULT 0,
    follower_count bigint DEFAULT 0,
    following_count bigint DEFAULT 0,
    repost_count bigint DEFAULT 0,
    track_save_count bigint DEFAULT 0,
    supporter_count integer DEFAULT 0 NOT NULL,
    supporting_count integer DEFAULT 0 NOT NULL
);


--
-- Name: aggregate_user_tips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aggregate_user_tips (
    sender_user_id integer NOT NULL,
    receiver_user_id integer NOT NULL,
    amount bigint NOT NULL
);


--
-- Name: app_delegates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_delegates (
    address character varying NOT NULL,
    blockhash character varying,
    blocknumber integer,
    user_id integer,
    name character varying NOT NULL,
    is_personal_access boolean DEFAULT false NOT NULL,
    is_delete boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone NOT NULL,
    txhash character varying NOT NULL,
    is_current boolean NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: app_name_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_name_metrics (
    application_name character varying NOT NULL,
    count integer NOT NULL,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id bigint NOT NULL,
    ip character varying
);


--
-- Name: app_name_metrics_all_time; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.app_name_metrics_all_time AS
 SELECT app_name_metrics.application_name AS name,
    sum(app_name_metrics.count) AS count
   FROM public.app_name_metrics
  GROUP BY app_name_metrics.application_name
  WITH NO DATA;


--
-- Name: app_name_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.app_name_metrics ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.app_name_metrics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: app_name_metrics_trailing_month; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.app_name_metrics_trailing_month AS
 SELECT app_name_metrics.application_name AS name,
    sum(app_name_metrics.count) AS count
   FROM public.app_name_metrics
  WHERE (app_name_metrics."timestamp" > (now() - '1 mon'::interval))
  GROUP BY app_name_metrics.application_name
  WITH NO DATA;


--
-- Name: app_name_metrics_trailing_week; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.app_name_metrics_trailing_week AS
 SELECT app_name_metrics.application_name AS name,
    sum(app_name_metrics.count) AS count
   FROM public.app_name_metrics
  WHERE (app_name_metrics."timestamp" > (now() - '7 days'::interval))
  GROUP BY app_name_metrics.application_name
  WITH NO DATA;


--
-- Name: associated_wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.associated_wallets (
    id integer NOT NULL,
    user_id integer NOT NULL,
    wallet character varying NOT NULL,
    blockhash character varying NOT NULL,
    blocknumber integer NOT NULL,
    is_current boolean NOT NULL,
    is_delete boolean NOT NULL,
    chain public.wallet_chain NOT NULL
);


--
-- Name: associated_wallets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.associated_wallets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: associated_wallets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.associated_wallets_id_seq OWNED BY public.associated_wallets.id;


--
-- Name: audio_transactions_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audio_transactions_history (
    user_bank character varying NOT NULL,
    slot integer NOT NULL,
    signature character varying NOT NULL,
    transaction_type character varying NOT NULL,
    method character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    transaction_created_at timestamp without time zone NOT NULL,
    change numeric NOT NULL,
    balance numeric NOT NULL,
    tx_metadata character varying
);


--
-- Name: audius_data_txs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audius_data_txs (
    signature character varying NOT NULL,
    slot integer NOT NULL
);


--
-- Name: blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blocks (
    blockhash character varying NOT NULL,
    parenthash character varying,
    is_current boolean,
    number integer
);


--
-- Name: challenge_disbursements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenge_disbursements (
    challenge_id character varying NOT NULL,
    user_id integer NOT NULL,
    specifier character varying NOT NULL,
    signature character varying NOT NULL,
    slot integer NOT NULL,
    amount character varying NOT NULL
);


--
-- Name: challenge_listen_streak; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenge_listen_streak (
    user_id integer NOT NULL,
    last_listen_date timestamp without time zone,
    listen_streak integer NOT NULL
);


--
-- Name: challenge_listen_streak_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.challenge_listen_streak_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: challenge_listen_streak_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.challenge_listen_streak_user_id_seq OWNED BY public.challenge_listen_streak.user_id;


--
-- Name: challenge_profile_completion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenge_profile_completion (
    user_id integer NOT NULL,
    profile_description boolean NOT NULL,
    profile_name boolean NOT NULL,
    profile_picture boolean NOT NULL,
    profile_cover_photo boolean NOT NULL,
    follows boolean NOT NULL,
    favorites boolean NOT NULL,
    reposts boolean NOT NULL
);


--
-- Name: challenge_profile_completion_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.challenge_profile_completion_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: challenge_profile_completion_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.challenge_profile_completion_user_id_seq OWNED BY public.challenge_profile_completion.user_id;


--
-- Name: challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenges (
    id character varying NOT NULL,
    type public.challengetype NOT NULL,
    amount character varying NOT NULL,
    active boolean NOT NULL,
    step_count integer,
    starting_block integer
);


--
-- Name: chat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat (
    chat_id text NOT NULL,
    created_at timestamp without time zone NOT NULL,
    last_message_at timestamp without time zone NOT NULL,
    last_message text
);


--
-- Name: chat_blocked_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_blocked_users (
    blocker_user_id integer NOT NULL,
    blockee_user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: chat_member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_member (
    chat_id text NOT NULL,
    user_id integer NOT NULL,
    cleared_history_at timestamp without time zone,
    invited_by_user_id integer NOT NULL,
    invite_code text NOT NULL,
    last_active_at timestamp without time zone,
    unread_count integer DEFAULT 0 NOT NULL
);


--
-- Name: chat_message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_message (
    message_id text NOT NULL,
    chat_id text NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone NOT NULL,
    ciphertext text NOT NULL
);


--
-- Name: chat_message_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_message_reactions (
    user_id integer NOT NULL,
    message_id text NOT NULL,
    reaction text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: chat_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_permissions (
    user_id integer NOT NULL,
    permits text DEFAULT 'all'::text
);


--
-- Name: cid_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cid_data (
    cid character varying NOT NULL,
    type character varying,
    data jsonb
);


--
-- Name: delegations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delegations (
    shared_address character varying NOT NULL,
    blockhash character varying,
    blocknumber integer,
    delegate_address character varying NOT NULL,
    user_id integer NOT NULL,
    is_revoked boolean DEFAULT false NOT NULL,
    is_current boolean NOT NULL,
    is_approved boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone NOT NULL,
    txhash character varying NOT NULL
);


--
-- Name: eth_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.eth_blocks (
    last_scanned_block integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: eth_blocks_last_scanned_block_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.eth_blocks_last_scanned_block_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: eth_blocks_last_scanned_block_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.eth_blocks_last_scanned_block_seq OWNED BY public.eth_blocks.last_scanned_block;


--
-- Name: follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follows (
    blockhash character varying,
    blocknumber integer,
    follower_user_id integer NOT NULL,
    followee_user_id integer NOT NULL,
    is_current boolean NOT NULL,
    is_delete boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    txhash character varying DEFAULT ''::character varying NOT NULL,
    slot integer
);


--
-- Name: hourly_play_counts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hourly_play_counts (
    hourly_timestamp timestamp without time zone NOT NULL,
    play_count integer NOT NULL
);


--
-- Name: indexing_checkpoints; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.indexing_checkpoints (
    tablename character varying NOT NULL,
    last_checkpoint integer NOT NULL,
    signature character varying
);


--
-- Name: milestones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.milestones (
    id integer NOT NULL,
    name character varying NOT NULL,
    threshold integer NOT NULL,
    blocknumber integer,
    slot integer,
    "timestamp" timestamp without time zone NOT NULL
);


--
-- Name: notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification (
    id integer NOT NULL,
    specifier character varying NOT NULL,
    group_id character varying NOT NULL,
    type character varying NOT NULL,
    slot integer,
    blocknumber integer,
    "timestamp" timestamp without time zone NOT NULL,
    data jsonb,
    user_ids integer[],
    type_v2 character varying
);


--
-- Name: notification_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notification_id_seq OWNED BY public.notification.id;


--
-- Name: notification_seen; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_seen (
    user_id integer NOT NULL,
    seen_at timestamp without time zone NOT NULL,
    blocknumber integer,
    blockhash character varying,
    txhash character varying
);


--
-- Name: playlist_routes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.playlist_routes (
    slug character varying NOT NULL,
    title_slug character varying NOT NULL,
    collision_id integer NOT NULL,
    owner_id integer NOT NULL,
    playlist_id integer NOT NULL,
    is_current boolean NOT NULL,
    blockhash character varying NOT NULL,
    blocknumber integer NOT NULL,
    txhash character varying NOT NULL
);


--
-- Name: playlist_seen; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.playlist_seen (
    user_id integer NOT NULL,
    playlist_id integer NOT NULL,
    seen_at timestamp without time zone NOT NULL,
    is_current boolean NOT NULL,
    blocknumber integer,
    blockhash character varying,
    txhash character varying
);


--
-- Name: playlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.playlists (
    blockhash character varying,
    blocknumber integer,
    playlist_id integer NOT NULL,
    playlist_owner_id integer NOT NULL,
    is_album boolean NOT NULL,
    is_private boolean NOT NULL,
    playlist_name character varying,
    playlist_contents jsonb NOT NULL,
    playlist_image_multihash character varying,
    is_current boolean NOT NULL,
    is_delete boolean NOT NULL,
    description character varying,
    created_at timestamp without time zone NOT NULL,
    upc character varying,
    updated_at timestamp without time zone NOT NULL,
    playlist_image_sizes_multihash character varying,
    txhash character varying DEFAULT ''::character varying NOT NULL,
    last_added_to timestamp without time zone,
    slot integer,
    metadata_multihash character varying
);


--
-- Name: plays_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.plays_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: plays_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.plays_id_seq OWNED BY public.plays.id;


--
-- Name: pubkeys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pubkeys (
    wallet text NOT NULL,
    pubkey text
);


--
-- Name: reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reactions (
    id integer NOT NULL,
    slot integer NOT NULL,
    reaction_value integer NOT NULL,
    sender_wallet character varying NOT NULL,
    reaction_type character varying NOT NULL,
    reacted_to character varying NOT NULL,
    "timestamp" timestamp without time zone NOT NULL,
    tx_signature character varying
);


--
-- Name: reactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reactions_id_seq OWNED BY public.reactions.id;


--
-- Name: related_artists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.related_artists (
    user_id integer NOT NULL,
    related_artist_user_id integer NOT NULL,
    score double precision NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: remixes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.remixes (
    parent_track_id integer NOT NULL,
    child_track_id integer NOT NULL
);


--
-- Name: reposts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reposts (
    blockhash character varying,
    blocknumber integer,
    user_id integer NOT NULL,
    repost_item_id integer NOT NULL,
    repost_type public.reposttype NOT NULL,
    is_current boolean NOT NULL,
    is_delete boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    txhash character varying DEFAULT ''::character varying NOT NULL,
    slot integer,
    is_repost_of_repost boolean DEFAULT false NOT NULL
);


--
-- Name: reward_manager_txs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reward_manager_txs (
    signature character varying NOT NULL,
    slot integer NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: rewards_manager_backfill_txs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rewards_manager_backfill_txs (
    signature character varying NOT NULL,
    slot integer NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: route_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.route_metrics (
    route_path character varying NOT NULL,
    version character varying NOT NULL,
    query_string character varying DEFAULT ''::character varying NOT NULL,
    count integer NOT NULL,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id bigint NOT NULL,
    ip character varying
);


--
-- Name: route_metrics_all_time; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.route_metrics_all_time AS
 SELECT count(DISTINCT route_metrics.ip) AS unique_count,
    sum(route_metrics.count) AS count
   FROM public.route_metrics
  WITH NO DATA;


--
-- Name: route_metrics_day_bucket; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.route_metrics_day_bucket AS
 SELECT count(DISTINCT route_metrics.ip) AS unique_count,
    sum(route_metrics.count) AS count,
    date_trunc('day'::text, route_metrics."timestamp") AS "time"
   FROM public.route_metrics
  GROUP BY (date_trunc('day'::text, route_metrics."timestamp"))
  WITH NO DATA;


--
-- Name: route_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.route_metrics ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.route_metrics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: route_metrics_month_bucket; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.route_metrics_month_bucket AS
 SELECT count(DISTINCT route_metrics.ip) AS unique_count,
    sum(route_metrics.count) AS count,
    date_trunc('month'::text, route_metrics."timestamp") AS "time"
   FROM public.route_metrics
  GROUP BY (date_trunc('month'::text, route_metrics."timestamp"))
  WITH NO DATA;


--
-- Name: route_metrics_trailing_month; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.route_metrics_trailing_month AS
 SELECT count(DISTINCT route_metrics.ip) AS unique_count,
    sum(route_metrics.count) AS count
   FROM public.route_metrics
  WHERE (route_metrics."timestamp" > (now() - '1 mon'::interval))
  WITH NO DATA;


--
-- Name: route_metrics_trailing_week; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.route_metrics_trailing_week AS
 SELECT count(DISTINCT route_metrics.ip) AS unique_count,
    sum(route_metrics.count) AS count
   FROM public.route_metrics
  WHERE (route_metrics."timestamp" > (now() - '7 days'::interval))
  WITH NO DATA;


--
-- Name: rpc_cursor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rpc_cursor (
    relayed_by text NOT NULL,
    relayed_at timestamp without time zone NOT NULL
);


--
-- Name: rpc_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rpc_log (
    relayed_at timestamp without time zone NOT NULL,
    from_wallet text NOT NULL,
    rpc json NOT NULL,
    sig text NOT NULL,
    relayed_by text NOT NULL,
    applied_at timestamp without time zone NOT NULL
);


--
-- Name: rpclog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rpclog (
    cuid text NOT NULL,
    wallet text,
    method text,
    params jsonb,
    jetstream_seq integer
);


--
-- Name: saves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saves (
    blockhash character varying,
    blocknumber integer,
    user_id integer NOT NULL,
    save_item_id integer NOT NULL,
    save_type public.savetype NOT NULL,
    is_current boolean NOT NULL,
    is_delete boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    txhash character varying DEFAULT ''::character varying NOT NULL,
    slot integer,
    is_save_of_repost boolean DEFAULT false NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: skipped_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skipped_transactions (
    id integer NOT NULL,
    blocknumber integer NOT NULL,
    blockhash character varying NOT NULL,
    txhash character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    level public.skippedtransactionlevel DEFAULT 'node'::public.skippedtransactionlevel
);


--
-- Name: skipped_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skipped_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skipped_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skipped_transactions_id_seq OWNED BY public.skipped_transactions.id;


--
-- Name: spl_token_backfill_txs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.spl_token_backfill_txs (
    last_scanned_slot integer NOT NULL,
    signature character varying NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: spl_token_backfill_txs_last_scanned_slot_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.spl_token_backfill_txs_last_scanned_slot_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: spl_token_backfill_txs_last_scanned_slot_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.spl_token_backfill_txs_last_scanned_slot_seq OWNED BY public.spl_token_backfill_txs.last_scanned_slot;


--
-- Name: spl_token_tx; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.spl_token_tx (
    last_scanned_slot integer NOT NULL,
    signature character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: stems; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stems (
    parent_track_id integer NOT NULL,
    child_track_id integer NOT NULL
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    blockhash character varying,
    blocknumber integer,
    subscriber_id integer NOT NULL,
    user_id integer NOT NULL,
    is_current boolean NOT NULL,
    is_delete boolean NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    txhash character varying DEFAULT ''::character varying NOT NULL
);


--
-- Name: supporter_rank_ups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supporter_rank_ups (
    slot integer NOT NULL,
    sender_user_id integer NOT NULL,
    receiver_user_id integer NOT NULL,
    rank integer NOT NULL
);


--
-- Name: tag_track_user; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.tag_track_user AS
 SELECT unnest(t.tags) AS tag,
    t.track_id,
    t.owner_id
   FROM ( SELECT string_to_array(lower((tracks.tags)::text), ','::text) AS tags,
            tracks.track_id,
            tracks.owner_id
           FROM public.tracks
          WHERE (((tracks.tags)::text <> ''::text) AND (tracks.tags IS NOT NULL) AND (tracks.is_current IS TRUE) AND (tracks.is_unlisted IS FALSE) AND (tracks.stem_of IS NULL))
          ORDER BY tracks.updated_at DESC) t
  GROUP BY (unnest(t.tags)), t.track_id, t.owner_id
  WITH NO DATA;


--
-- Name: track_routes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.track_routes (
    slug character varying NOT NULL,
    title_slug character varying NOT NULL,
    collision_id integer NOT NULL,
    owner_id integer NOT NULL,
    track_id integer NOT NULL,
    is_current boolean NOT NULL,
    blockhash character varying NOT NULL,
    blocknumber integer NOT NULL,
    txhash character varying NOT NULL
);


--
-- Name: track_trending_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.track_trending_scores (
    track_id integer NOT NULL,
    type character varying NOT NULL,
    genre character varying,
    version character varying NOT NULL,
    time_range character varying NOT NULL,
    score double precision NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    blockhash character varying,
    user_id integer NOT NULL,
    is_current boolean NOT NULL,
    handle character varying,
    wallet character varying,
    name text,
    profile_picture character varying,
    cover_photo character varying,
    bio character varying,
    location character varying,
    metadata_multihash character varying,
    creator_node_endpoint character varying,
    blocknumber integer,
    is_verified boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    handle_lc character varying,
    cover_photo_sizes character varying,
    profile_picture_sizes character varying,
    primary_id integer,
    secondary_ids integer[],
    replica_set_update_signer character varying,
    has_collectibles boolean DEFAULT false NOT NULL,
    txhash character varying DEFAULT ''::character varying NOT NULL,
    playlist_library jsonb,
    is_deactivated boolean DEFAULT false NOT NULL,
    slot integer,
    user_storage_account character varying,
    user_authority_account character varying,
    artist_pick_track_id integer,
    is_available boolean DEFAULT true NOT NULL,
    is_storage_v2 boolean DEFAULT false NOT NULL,
    allow_ai_attribution boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.users IS 'the users table';


--
-- Name: trending_params; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.trending_params AS
 SELECT t.track_id,
    t.genre,
    t.owner_id,
    ap.play_count,
    au.follower_count AS owner_follower_count,
    COALESCE(aggregate_track.repost_count, 0) AS repost_count,
    COALESCE(aggregate_track.save_count, 0) AS save_count,
    COALESCE(repost_week.repost_count, (0)::bigint) AS repost_week_count,
    COALESCE(repost_month.repost_count, (0)::bigint) AS repost_month_count,
    COALESCE(repost_year.repost_count, (0)::bigint) AS repost_year_count,
    COALESCE(save_week.repost_count, (0)::bigint) AS save_week_count,
    COALESCE(save_month.repost_count, (0)::bigint) AS save_month_count,
    COALESCE(save_year.repost_count, (0)::bigint) AS save_year_count,
    COALESCE(karma.karma, (0)::numeric) AS karma
   FROM ((((((((((public.tracks t
     LEFT JOIN ( SELECT ap_1.count AS play_count,
            ap_1.play_item_id
           FROM public.aggregate_plays ap_1) ap ON ((ap.play_item_id = t.track_id)))
     LEFT JOIN ( SELECT au_1.user_id,
            au_1.follower_count
           FROM public.aggregate_user au_1) au ON ((au.user_id = t.owner_id)))
     LEFT JOIN ( SELECT aggregate_track_1.track_id,
            aggregate_track_1.repost_count,
            aggregate_track_1.save_count
           FROM public.aggregate_track aggregate_track_1) aggregate_track ON ((aggregate_track.track_id = t.track_id)))
     LEFT JOIN ( SELECT r.repost_item_id AS track_id,
            count(r.repost_item_id) AS repost_count
           FROM public.reposts r
          WHERE ((r.is_current IS TRUE) AND (r.repost_type = 'track'::public.reposttype) AND (r.is_delete IS FALSE) AND (r.created_at > (now() - '1 year'::interval)))
          GROUP BY r.repost_item_id) repost_year ON ((repost_year.track_id = t.track_id)))
     LEFT JOIN ( SELECT r.repost_item_id AS track_id,
            count(r.repost_item_id) AS repost_count
           FROM public.reposts r
          WHERE ((r.is_current IS TRUE) AND (r.repost_type = 'track'::public.reposttype) AND (r.is_delete IS FALSE) AND (r.created_at > (now() - '1 mon'::interval)))
          GROUP BY r.repost_item_id) repost_month ON ((repost_month.track_id = t.track_id)))
     LEFT JOIN ( SELECT r.repost_item_id AS track_id,
            count(r.repost_item_id) AS repost_count
           FROM public.reposts r
          WHERE ((r.is_current IS TRUE) AND (r.repost_type = 'track'::public.reposttype) AND (r.is_delete IS FALSE) AND (r.created_at > (now() - '7 days'::interval)))
          GROUP BY r.repost_item_id) repost_week ON ((repost_week.track_id = t.track_id)))
     LEFT JOIN ( SELECT r.save_item_id AS track_id,
            count(r.save_item_id) AS repost_count
           FROM public.saves r
          WHERE ((r.is_current IS TRUE) AND (r.save_type = 'track'::public.savetype) AND (r.is_delete IS FALSE) AND (r.created_at > (now() - '1 year'::interval)))
          GROUP BY r.save_item_id) save_year ON ((save_year.track_id = t.track_id)))
     LEFT JOIN ( SELECT r.save_item_id AS track_id,
            count(r.save_item_id) AS repost_count
           FROM public.saves r
          WHERE ((r.is_current IS TRUE) AND (r.save_type = 'track'::public.savetype) AND (r.is_delete IS FALSE) AND (r.created_at > (now() - '1 mon'::interval)))
          GROUP BY r.save_item_id) save_month ON ((save_month.track_id = t.track_id)))
     LEFT JOIN ( SELECT r.save_item_id AS track_id,
            count(r.save_item_id) AS repost_count
           FROM public.saves r
          WHERE ((r.is_current IS TRUE) AND (r.save_type = 'track'::public.savetype) AND (r.is_delete IS FALSE) AND (r.created_at > (now() - '7 days'::interval)))
          GROUP BY r.save_item_id) save_week ON ((save_week.track_id = t.track_id)))
     LEFT JOIN ( SELECT save_and_reposts.item_id AS track_id,
            sum(au_1.follower_count) AS karma
           FROM (( SELECT r_and_s.user_id,
                    r_and_s.item_id
                   FROM (( SELECT reposts.user_id,
                            reposts.repost_item_id AS item_id
                           FROM public.reposts
                          WHERE ((reposts.is_delete IS FALSE) AND (reposts.is_current IS TRUE) AND (reposts.repost_type = 'track'::public.reposttype))
                        UNION ALL
                         SELECT saves.user_id,
                            saves.save_item_id AS item_id
                           FROM public.saves
                          WHERE ((saves.is_delete IS FALSE) AND (saves.is_current IS TRUE) AND (saves.save_type = 'track'::public.savetype))) r_and_s
                     JOIN public.users ON ((r_and_s.user_id = users.user_id)))
                  WHERE (((users.cover_photo IS NOT NULL) OR (users.cover_photo_sizes IS NOT NULL)) AND ((users.profile_picture IS NOT NULL) OR (users.profile_picture_sizes IS NOT NULL)) AND (users.bio IS NOT NULL))) save_and_reposts
             JOIN public.aggregate_user au_1 ON ((save_and_reposts.user_id = au_1.user_id)))
          GROUP BY save_and_reposts.item_id) karma ON ((karma.track_id = t.track_id)))
  WHERE ((t.is_current IS TRUE) AND (t.is_delete IS FALSE) AND (t.is_unlisted IS FALSE) AND (t.stem_of IS NULL))
  WITH NO DATA;


--
-- Name: trending_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trending_results (
    user_id integer NOT NULL,
    id character varying,
    rank integer NOT NULL,
    type character varying NOT NULL,
    version character varying NOT NULL,
    week date NOT NULL
);


--
-- Name: ursm_content_nodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ursm_content_nodes (
    blockhash character varying,
    blocknumber integer,
    created_at timestamp without time zone NOT NULL,
    is_current boolean NOT NULL,
    cnode_sp_id integer NOT NULL,
    delegate_owner_wallet character varying NOT NULL,
    owner_wallet character varying NOT NULL,
    proposer_sp_ids integer[] NOT NULL,
    proposer_1_delegate_owner_wallet character varying NOT NULL,
    proposer_2_delegate_owner_wallet character varying NOT NULL,
    proposer_3_delegate_owner_wallet character varying NOT NULL,
    endpoint character varying,
    txhash character varying DEFAULT ''::character varying NOT NULL,
    slot integer
);


--
-- Name: user_balance_changes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_balance_changes (
    user_id integer NOT NULL,
    blocknumber integer NOT NULL,
    current_balance character varying NOT NULL,
    previous_balance character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_balance_changes_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_balance_changes_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_balance_changes_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_balance_changes_user_id_seq OWNED BY public.user_balance_changes.user_id;


--
-- Name: user_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_balances (
    user_id integer NOT NULL,
    balance character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    associated_wallets_balance character varying DEFAULT '0'::character varying NOT NULL,
    waudio character varying DEFAULT '0'::character varying,
    associated_sol_wallets_balance character varying DEFAULT '0'::character varying NOT NULL
);


--
-- Name: user_balances_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_balances_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_balances_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_balances_user_id_seq OWNED BY public.user_balances.user_id;


--
-- Name: user_bank_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_bank_accounts (
    signature character varying NOT NULL,
    ethereum_address character varying NOT NULL,
    created_at timestamp without time zone NOT NULL,
    bank_account character varying NOT NULL
);


--
-- Name: user_bank_backfill_txs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_bank_backfill_txs (
    signature character varying NOT NULL,
    slot integer NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: user_bank_txs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_bank_txs (
    signature character varying NOT NULL,
    slot integer NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: user_challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_challenges (
    challenge_id character varying NOT NULL,
    user_id integer NOT NULL,
    specifier character varying NOT NULL,
    is_complete boolean NOT NULL,
    current_step_count integer,
    completed_blocknumber integer
);


--
-- Name: user_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_events (
    id integer NOT NULL,
    blockhash character varying,
    blocknumber integer,
    is_current boolean NOT NULL,
    user_id integer NOT NULL,
    referrer integer,
    is_mobile_user boolean DEFAULT false NOT NULL,
    slot integer
);


--
-- Name: user_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_events_id_seq OWNED BY public.user_events.id;


--
-- Name: user_listening_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_listening_history (
    user_id integer NOT NULL,
    listening_history jsonb NOT NULL
);


--
-- Name: user_listening_history_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_listening_history_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_listening_history_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_listening_history_user_id_seq OWNED BY public.user_listening_history.user_id;


--
-- Name: user_pubkeys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_pubkeys (
    user_id integer NOT NULL,
    pubkey_base64 text NOT NULL
);


--
-- Name: user_tips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_tips (
    slot integer NOT NULL,
    signature character varying NOT NULL,
    sender_user_id integer NOT NULL,
    receiver_user_id integer NOT NULL,
    amount bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: aggregate_daily_app_name_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aggregate_daily_app_name_metrics ALTER COLUMN id SET DEFAULT nextval('public.aggregate_daily_app_name_metrics_id_seq'::regclass);


--
-- Name: aggregate_daily_total_users_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aggregate_daily_total_users_metrics ALTER COLUMN id SET DEFAULT nextval('public.aggregate_daily_total_users_metrics_id_seq'::regclass);


--
-- Name: aggregate_daily_unique_users_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aggregate_daily_unique_users_metrics ALTER COLUMN id SET DEFAULT nextval('public.aggregate_daily_unique_users_metrics_id_seq'::regclass);


--
-- Name: aggregate_monthly_app_name_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aggregate_monthly_app_name_metrics ALTER COLUMN id SET DEFAULT nextval('public.aggregate_monthly_app_name_metrics_id_seq'::regclass);


--
-- Name: aggregate_monthly_total_users_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aggregate_monthly_total_users_metrics ALTER COLUMN id SET DEFAULT nextval('public.aggregate_monthly_total_users_metrics_id_seq'::regclass);


--
-- Name: aggregate_monthly_unique_users_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aggregate_monthly_unique_users_metrics ALTER COLUMN id SET DEFAULT nextval('public.aggregate_monthly_unique_users_metrics_id_seq'::regclass);


--
-- Name: associated_wallets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.associated_wallets ALTER COLUMN id SET DEFAULT nextval('public.associated_wallets_id_seq'::regclass);


--
-- Name: challenge_listen_streak user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_listen_streak ALTER COLUMN user_id SET DEFAULT nextval('public.challenge_listen_streak_user_id_seq'::regclass);


--
-- Name: challenge_profile_completion user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_profile_completion ALTER COLUMN user_id SET DEFAULT nextval('public.challenge_profile_completion_user_id_seq'::regclass);


--
-- Name: eth_blocks last_scanned_block; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eth_blocks ALTER COLUMN last_scanned_block SET DEFAULT nextval('public.eth_blocks_last_scanned_block_seq'::regclass);


--
-- Name: notification id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification ALTER COLUMN id SET DEFAULT nextval('public.notification_id_seq'::regclass);


--
-- Name: plays id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plays ALTER COLUMN id SET DEFAULT nextval('public.plays_id_seq'::regclass);


--
-- Name: reactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reactions ALTER COLUMN id SET DEFAULT nextval('public.reactions_id_seq'::regclass);


--
-- Name: skipped_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skipped_transactions ALTER COLUMN id SET DEFAULT nextval('public.skipped_transactions_id_seq'::regclass);


--
-- Name: spl_token_backfill_txs last_scanned_slot; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spl_token_backfill_txs ALTER COLUMN last_scanned_slot SET DEFAULT nextval('public.spl_token_backfill_txs_last_scanned_slot_seq'::regclass);


--
-- Name: user_balance_changes user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_balance_changes ALTER COLUMN user_id SET DEFAULT nextval('public.user_balance_changes_user_id_seq'::regclass);


--
-- Name: user_balances user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_balances ALTER COLUMN user_id SET DEFAULT nextval('public.user_balances_user_id_seq'::regclass);


--
-- Name: user_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_events ALTER COLUMN id SET DEFAULT nextval('public.user_events_id_seq'::regclass);


--
-- Name: user_listening_history user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_listening_history ALTER COLUMN user_id SET DEFAULT nextval('public.user_listening_history_user_id_seq'::regclass);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: aggregate_daily_app_name_metrics aggregate_daily_app_name_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aggregate_daily_app_name_metrics
    ADD CONSTRAINT aggregate_daily_app_name_metrics_pkey PRIMARY KEY (id);


--
-- Name: aggregate_daily_total_users_metrics aggregate_daily_total_users_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aggregate_daily_total_users_metrics
    ADD CONSTRAINT aggregate_daily_total_users_metrics_pkey PRIMARY KEY (id);


--
-- Name: aggregate_daily_unique_users_metrics aggregate_daily_unique_users_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aggregate_daily_unique_users_metrics
    ADD CONSTRAINT aggregate_daily_unique_users_metrics_pkey PRIMARY KEY (id);


--
-- Name: aggregate_monthly_app_name_metrics aggregate_monthly_app_name_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aggregate_monthly_app_name_metrics
    ADD CONSTRAINT aggregate_monthly_app_name_metrics_pkey PRIMARY KEY (id);


--
-- Name: aggregate_monthly_plays aggregate_monthly_plays_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aggregate_monthly_plays
    ADD CONSTRAINT aggregate_monthly_plays_pkey PRIMARY KEY (play_item_id, "timestamp");


--
-- Name: aggregate_monthly_total_users_metrics aggregate_monthly_total_users_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aggregate_monthly_total_users_metrics
    ADD CONSTRAINT aggregate_monthly_total_users_metrics_pkey PRIMARY KEY (id);


--
-- Name: aggregate_monthly_unique_users_metrics aggregate_monthly_unique_users_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aggregate_monthly_unique_users_metrics
    ADD CONSTRAINT aggregate_monthly_unique_users_metrics_pkey PRIMARY KEY (id);


--
-- Name: aggregate_playlist aggregate_playlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aggregate_playlist
    ADD CONSTRAINT aggregate_playlist_pkey PRIMARY KEY (playlist_id);


--
-- Name: aggregate_track aggregate_track_table_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aggregate_track
    ADD CONSTRAINT aggregate_track_table_pkey PRIMARY KEY (track_id);


--
-- Name: aggregate_user aggregate_user_table_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aggregate_user
    ADD CONSTRAINT aggregate_user_table_pkey PRIMARY KEY (user_id);


--
-- Name: aggregate_user_tips aggregate_user_tips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aggregate_user_tips
    ADD CONSTRAINT aggregate_user_tips_pkey PRIMARY KEY (sender_user_id, receiver_user_id);


--
-- Name: app_delegates app_delegates_primary_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_delegates
    ADD CONSTRAINT app_delegates_primary_key PRIMARY KEY (address, is_current, txhash);


--
-- Name: app_name_metrics app_name_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_name_metrics
    ADD CONSTRAINT app_name_metrics_pkey PRIMARY KEY (id);


--
-- Name: associated_wallets associated_wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.associated_wallets
    ADD CONSTRAINT associated_wallets_pkey PRIMARY KEY (id);


--
-- Name: audio_transactions_history audio_transactions_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_transactions_history
    ADD CONSTRAINT audio_transactions_history_pkey PRIMARY KEY (user_bank, signature);


--
-- Name: audius_data_txs audius_data_txs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audius_data_txs
    ADD CONSTRAINT audius_data_txs_pkey PRIMARY KEY (signature);


--
-- Name: blocks blocks_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_number_key UNIQUE (number);


--
-- Name: blocks blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_pkey PRIMARY KEY (blockhash);


--
-- Name: challenge_disbursements challenge_disbursements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_disbursements
    ADD CONSTRAINT challenge_disbursements_pkey PRIMARY KEY (challenge_id, specifier);


--
-- Name: challenge_listen_streak challenge_listen_streak_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_listen_streak
    ADD CONSTRAINT challenge_listen_streak_pkey PRIMARY KEY (user_id);


--
-- Name: challenge_profile_completion challenge_profile_completion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_profile_completion
    ADD CONSTRAINT challenge_profile_completion_pkey PRIMARY KEY (user_id);


--
-- Name: challenges challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_pkey PRIMARY KEY (id);


--
-- Name: chat_blocked_users chat_blocked_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_blocked_users
    ADD CONSTRAINT chat_blocked_users_pkey PRIMARY KEY (blocker_user_id, blockee_user_id);


--
-- Name: chat_member chat_member_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_member
    ADD CONSTRAINT chat_member_pkey PRIMARY KEY (chat_id, user_id);


--
-- Name: chat_message chat_message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_message
    ADD CONSTRAINT chat_message_pkey PRIMARY KEY (message_id);


--
-- Name: chat_message_reactions chat_message_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_message_reactions
    ADD CONSTRAINT chat_message_reactions_pkey PRIMARY KEY (user_id, message_id);


--
-- Name: chat_permissions chat_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_permissions
    ADD CONSTRAINT chat_permissions_pkey PRIMARY KEY (user_id);


--
-- Name: chat chat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat
    ADD CONSTRAINT chat_pkey PRIMARY KEY (chat_id);


--
-- Name: cid_data cid_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cid_data
    ADD CONSTRAINT cid_data_pkey PRIMARY KEY (cid);


--
-- Name: delegations delegations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delegations
    ADD CONSTRAINT delegations_pkey PRIMARY KEY (shared_address, is_current, txhash);


--
-- Name: eth_blocks eth_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eth_blocks
    ADD CONSTRAINT eth_blocks_pkey PRIMARY KEY (last_scanned_block);


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (is_current, follower_user_id, followee_user_id, txhash);


--
-- Name: hourly_play_counts hourly_play_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hourly_play_counts
    ADD CONSTRAINT hourly_play_counts_pkey PRIMARY KEY (hourly_timestamp);


--
-- Name: indexing_checkpoints indexing_checkpoints_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.indexing_checkpoints
    ADD CONSTRAINT indexing_checkpoints_pkey PRIMARY KEY (tablename);


--
-- Name: milestones milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.milestones
    ADD CONSTRAINT milestones_pkey PRIMARY KEY (id, name, threshold);


--
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);


--
-- Name: notification_seen notification_seen_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_seen
    ADD CONSTRAINT notification_seen_pkey PRIMARY KEY (user_id, seen_at);


--
-- Name: aggregate_plays play_item_id_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aggregate_plays
    ADD CONSTRAINT play_item_id_pkey PRIMARY KEY (play_item_id);


--
-- Name: playlist_routes playlist_routes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist_routes
    ADD CONSTRAINT playlist_routes_pkey PRIMARY KEY (owner_id, slug);


--
-- Name: playlist_seen playlist_seen_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist_seen
    ADD CONSTRAINT playlist_seen_pkey PRIMARY KEY (is_current, user_id, playlist_id, seen_at);


--
-- Name: playlists playlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlists
    ADD CONSTRAINT playlists_pkey PRIMARY KEY (is_current, playlist_id, txhash);


--
-- Name: plays plays_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plays
    ADD CONSTRAINT plays_pkey PRIMARY KEY (id);


--
-- Name: pubkeys pubkeys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pubkeys
    ADD CONSTRAINT pubkeys_pkey PRIMARY KEY (wallet);


--
-- Name: reactions reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_pkey PRIMARY KEY (id);


--
-- Name: related_artists related_artists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.related_artists
    ADD CONSTRAINT related_artists_pkey PRIMARY KEY (user_id, related_artist_user_id);


--
-- Name: remixes remixes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remixes
    ADD CONSTRAINT remixes_pkey PRIMARY KEY (parent_track_id, child_track_id);


--
-- Name: reposts reposts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reposts
    ADD CONSTRAINT reposts_pkey PRIMARY KEY (is_current, user_id, repost_item_id, repost_type, txhash);


--
-- Name: reward_manager_txs reward_manager_txs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_manager_txs
    ADD CONSTRAINT reward_manager_txs_pkey PRIMARY KEY (signature);


--
-- Name: rewards_manager_backfill_txs rewards_manager_backfill_txs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rewards_manager_backfill_txs
    ADD CONSTRAINT rewards_manager_backfill_txs_pkey PRIMARY KEY (signature);


--
-- Name: route_metrics route_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.route_metrics
    ADD CONSTRAINT route_metrics_pkey PRIMARY KEY (id);


--
-- Name: rpc_cursor rpc_cursor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rpc_cursor
    ADD CONSTRAINT rpc_cursor_pkey PRIMARY KEY (relayed_by);


--
-- Name: rpc_log rpc_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rpc_log
    ADD CONSTRAINT rpc_log_pkey PRIMARY KEY (sig);


--
-- Name: rpclog rpclog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rpclog
    ADD CONSTRAINT rpclog_pkey PRIMARY KEY (cuid);


--
-- Name: saves saves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saves
    ADD CONSTRAINT saves_pkey PRIMARY KEY (is_current, user_id, save_item_id, save_type, txhash);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: skipped_transactions skipped_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skipped_transactions
    ADD CONSTRAINT skipped_transactions_pkey PRIMARY KEY (id);


--
-- Name: spl_token_backfill_txs spl_token_backfill_txs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spl_token_backfill_txs
    ADD CONSTRAINT spl_token_backfill_txs_pkey PRIMARY KEY (last_scanned_slot);


--
-- Name: spl_token_tx spl_token_tx_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spl_token_tx
    ADD CONSTRAINT spl_token_tx_pkey PRIMARY KEY (last_scanned_slot);


--
-- Name: stems stems_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stems
    ADD CONSTRAINT stems_pkey PRIMARY KEY (parent_track_id, child_track_id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (subscriber_id, user_id, is_current, txhash);


--
-- Name: supporter_rank_ups supporter_rank_ups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supporter_rank_ups
    ADD CONSTRAINT supporter_rank_ups_pkey PRIMARY KEY (slot, sender_user_id, receiver_user_id);


--
-- Name: track_routes track_routes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.track_routes
    ADD CONSTRAINT track_routes_pkey PRIMARY KEY (owner_id, slug);


--
-- Name: track_trending_scores track_trending_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.track_trending_scores
    ADD CONSTRAINT track_trending_scores_pkey PRIMARY KEY (track_id, type, version, time_range);


--
-- Name: tracks tracks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracks
    ADD CONSTRAINT tracks_pkey PRIMARY KEY (is_current, track_id, txhash);


--
-- Name: trending_results trending_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trending_results
    ADD CONSTRAINT trending_results_pkey PRIMARY KEY (rank, type, version, week);


--
-- Name: notification uq_notification; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT uq_notification UNIQUE (group_id, specifier);


--
-- Name: ursm_content_nodes ursm_content_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ursm_content_nodes
    ADD CONSTRAINT ursm_content_nodes_pkey PRIMARY KEY (is_current, cnode_sp_id, txhash);


--
-- Name: user_balance_changes user_balance_changes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_balance_changes
    ADD CONSTRAINT user_balance_changes_pkey PRIMARY KEY (user_id);


--
-- Name: user_balances user_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_balances
    ADD CONSTRAINT user_balances_pkey PRIMARY KEY (user_id);


--
-- Name: user_bank_accounts user_bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bank_accounts
    ADD CONSTRAINT user_bank_accounts_pkey PRIMARY KEY (signature);


--
-- Name: user_bank_backfill_txs user_bank_backfill_txs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bank_backfill_txs
    ADD CONSTRAINT user_bank_backfill_txs_pkey PRIMARY KEY (signature);


--
-- Name: user_bank_txs user_bank_txs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bank_txs
    ADD CONSTRAINT user_bank_txs_pkey PRIMARY KEY (signature);


--
-- Name: user_challenges user_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_challenges
    ADD CONSTRAINT user_challenges_pkey PRIMARY KEY (challenge_id, specifier);


--
-- Name: user_events user_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_events
    ADD CONSTRAINT user_events_pkey PRIMARY KEY (id);


--
-- Name: user_listening_history user_listening_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_listening_history
    ADD CONSTRAINT user_listening_history_pkey PRIMARY KEY (user_id);


--
-- Name: user_pubkeys user_pubkeys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_pubkeys
    ADD CONSTRAINT user_pubkeys_pkey PRIMARY KEY (user_id);


--
-- Name: user_tips user_tips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tips
    ADD CONSTRAINT user_tips_pkey PRIMARY KEY (slot, signature);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (is_current, user_id, txhash);


--
-- Name: blocks_is_current_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX blocks_is_current_idx ON public.blocks USING btree (is_current) WHERE (is_current IS TRUE);


--
-- Name: chat_chat_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_chat_id_idx ON public.chat USING btree (chat_id);


--
-- Name: chat_member_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_member_user_idx ON public.chat_member USING btree (user_id);


--
-- Name: follows_blocknumber_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX follows_blocknumber_idx ON public.follows USING btree (blocknumber);


--
-- Name: follows_inbound_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX follows_inbound_idx ON public.follows USING btree (followee_user_id, follower_user_id, is_current, is_delete);


--
-- Name: idx_challenge_disbursements_slot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_challenge_disbursements_slot ON public.challenge_disbursements USING btree (slot);


--
-- Name: idx_chat_message_chat_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_message_chat_id ON public.chat_message USING btree (chat_id);


--
-- Name: idx_chat_message_reactions_message_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_message_reactions_message_id ON public.chat_message_reactions USING btree (message_id);


--
-- Name: idx_chat_message_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_message_user_id ON public.chat_message USING btree (user_id);


--
-- Name: idx_reward_manager_txs_slot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reward_manager_txs_slot ON public.reward_manager_txs USING btree (slot);


--
-- Name: idx_rewards_manager_backfill_txs_slot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rewards_manager_backfill_txs_slot ON public.rewards_manager_backfill_txs USING btree (slot);


--
-- Name: idx_rpc_relayed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rpc_relayed_by ON public.rpc_log USING btree (relayed_by, relayed_at);


--
-- Name: idx_user_bank_backfill_txs_slot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_bank_backfill_txs_slot ON public.user_bank_backfill_txs USING btree (slot);


--
-- Name: idx_user_bank_eth_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_bank_eth_address ON public.user_bank_accounts USING btree (ethereum_address);


--
-- Name: idx_user_bank_txs_slot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_bank_txs_slot ON public.user_bank_txs USING btree (slot);


--
-- Name: interval_play_month_count_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX interval_play_month_count_idx ON public.aggregate_interval_plays USING btree (month_listen_counts);


--
-- Name: interval_play_track_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX interval_play_track_id_idx ON public.aggregate_interval_plays USING btree (track_id);


--
-- Name: interval_play_week_count_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX interval_play_week_count_idx ON public.aggregate_interval_plays USING btree (week_listen_counts);


--
-- Name: is_current_blocks_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX is_current_blocks_idx ON public.blocks USING btree (is_current);


--
-- Name: ix_aggregate_user_tips_receiver_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_aggregate_user_tips_receiver_user_id ON public.aggregate_user_tips USING btree (receiver_user_id);


--
-- Name: ix_associated_wallets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_associated_wallets_user_id ON public.associated_wallets USING btree (user_id, is_current);


--
-- Name: ix_associated_wallets_wallet; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_associated_wallets_wallet ON public.associated_wallets USING btree (wallet, is_current);


--
-- Name: ix_audio_transactions_history_slot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audio_transactions_history_slot ON public.audio_transactions_history USING btree (slot);


--
-- Name: ix_audio_transactions_history_transaction_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audio_transactions_history_transaction_type ON public.audio_transactions_history USING btree (transaction_type);


--
-- Name: ix_follows_followee_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_follows_followee_user_id ON public.follows USING btree (followee_user_id);


--
-- Name: ix_follows_follower_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_follows_follower_user_id ON public.follows USING btree (follower_user_id);


--
-- Name: ix_notification; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notification ON public.notification USING gin (user_ids);


--
-- Name: ix_plays_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_plays_created_at ON public.plays USING btree (created_at);


--
-- Name: ix_plays_slot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_plays_slot ON public.plays USING btree (slot);


--
-- Name: ix_plays_sol_signature; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_plays_sol_signature ON public.plays USING btree (signature);


--
-- Name: ix_plays_user_play_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_plays_user_play_item ON public.plays USING btree (play_item_id, user_id);


--
-- Name: ix_plays_user_play_item_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_plays_user_play_item_date ON public.plays USING btree (play_item_id, user_id, created_at);


--
-- Name: ix_reactions_reacted_to_reaction_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_reactions_reacted_to_reaction_type ON public.reactions USING btree (reacted_to, reaction_type);


--
-- Name: ix_reactions_slot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_reactions_slot ON public.reactions USING btree (slot);


--
-- Name: ix_subscriptions_blocknumber; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_subscriptions_blocknumber ON public.subscriptions USING btree (blocknumber);


--
-- Name: ix_subscriptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_subscriptions_user_id ON public.subscriptions USING btree (user_id);


--
-- Name: ix_supporter_rank_ups_receiver_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_supporter_rank_ups_receiver_user_id ON public.supporter_rank_ups USING btree (receiver_user_id);


--
-- Name: ix_supporter_rank_ups_sender_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_supporter_rank_ups_sender_user_id ON public.supporter_rank_ups USING btree (sender_user_id);


--
-- Name: ix_supporter_rank_ups_slot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_supporter_rank_ups_slot ON public.supporter_rank_ups USING btree (slot);


--
-- Name: ix_track_trending_scores_genre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_track_trending_scores_genre ON public.track_trending_scores USING btree (genre);


--
-- Name: ix_track_trending_scores_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_track_trending_scores_score ON public.track_trending_scores USING btree (score);


--
-- Name: ix_track_trending_scores_track_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_track_trending_scores_track_id ON public.track_trending_scores USING btree (track_id);


--
-- Name: ix_track_trending_scores_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_track_trending_scores_type ON public.track_trending_scores USING btree (type);


--
-- Name: ix_user_tips_receiver_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_user_tips_receiver_user_id ON public.user_tips USING btree (receiver_user_id);


--
-- Name: ix_user_tips_sender_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_user_tips_sender_user_id ON public.user_tips USING btree (sender_user_id);


--
-- Name: ix_user_tips_slot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_user_tips_slot ON public.user_tips USING btree (slot);


--
-- Name: ix_users_handle_lc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_handle_lc ON public.users USING btree (handle_lc);


--
-- Name: ix_users_is_deactivated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_is_deactivated ON public.users USING btree (is_deactivated);


--
-- Name: ix_users_wallet; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_wallet ON public.users USING btree (wallet);


--
-- Name: milestones_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX milestones_name_idx ON public.milestones USING btree (name, id);


--
-- Name: notification_seen_blocknumber_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notification_seen_blocknumber_idx ON public.notification_seen USING btree (blocknumber);


--
-- Name: play_item_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX play_item_idx ON public.plays USING btree (play_item_id);


--
-- Name: play_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX play_updated_at_idx ON public.plays USING btree (updated_at);


--
-- Name: playlist_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX playlist_created_at_idx ON public.playlists USING btree (created_at);


--
-- Name: playlist_owner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX playlist_owner_id_idx ON public.playlists USING btree (playlist_owner_id);


--
-- Name: playlist_routes_playlist_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX playlist_routes_playlist_id_idx ON public.playlist_routes USING btree (playlist_id, is_current);


--
-- Name: playlists_blocknumber_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX playlists_blocknumber_idx ON public.playlists USING btree (blocknumber);


--
-- Name: related_artists_related_artist_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX related_artists_related_artist_id_idx ON public.related_artists USING btree (related_artist_user_id, user_id);


--
-- Name: repost_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX repost_created_at_idx ON public.reposts USING btree (created_at);


--
-- Name: repost_item_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX repost_item_id_idx ON public.reposts USING btree (repost_item_id, repost_type);


--
-- Name: repost_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX repost_user_id_idx ON public.reposts USING btree (user_id, repost_type);


--
-- Name: reposts_blocknumber_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reposts_blocknumber_idx ON public.reposts USING btree (blocknumber);


--
-- Name: rpclog_method_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rpclog_method_idx ON public.rpclog USING btree (method);


--
-- Name: rpclog_wallet_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rpclog_wallet_idx ON public.rpclog USING btree (wallet);


--
-- Name: save_item_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX save_item_id_idx ON public.saves USING btree (save_item_id, save_type);


--
-- Name: save_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX save_user_id_idx ON public.saves USING btree (user_id, save_type);


--
-- Name: saves_blocknumber_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX saves_blocknumber_idx ON public.saves USING btree (blocknumber);


--
-- Name: tag_track_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tag_track_user_idx ON public.tag_track_user USING btree (tag, track_id, owner_id);


--
-- Name: tag_track_user_tag_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tag_track_user_tag_idx ON public.tag_track_user USING btree (tag);


--
-- Name: track_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX track_created_at_idx ON public.tracks USING btree (created_at);


--
-- Name: track_is_premium_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX track_is_premium_idx ON public.tracks USING btree (is_premium, is_current, is_delete);


--
-- Name: track_owner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX track_owner_id_idx ON public.tracks USING btree (owner_id);


--
-- Name: track_routes_track_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX track_routes_track_id_idx ON public.track_routes USING btree (track_id, is_current);


--
-- Name: tracks_ai_attribution_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tracks_ai_attribution_user_id ON public.tracks USING btree (ai_attribution_user_id, is_current) WHERE ((is_current = true) AND (ai_attribution_user_id IS NOT NULL));


--
-- Name: tracks_blocknumber_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tracks_blocknumber_idx ON public.tracks USING btree (blocknumber);


--
-- Name: tracks_track_cid_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tracks_track_cid_idx ON public.tracks USING btree (track_cid, is_current, is_delete);


--
-- Name: trending_params_track_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trending_params_track_id_idx ON public.trending_params USING btree (track_id);


--
-- Name: user_challenges_challenge_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_challenges_challenge_idx ON public.user_challenges USING btree (challenge_id);


--
-- Name: user_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_created_at_idx ON public.users USING btree (created_at, user_id) WHERE is_current;


--
-- Name: user_events_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_events_user_id_idx ON public.user_events USING btree (user_id, is_current);


--
-- Name: users_blocknumber_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_blocknumber_idx ON public.users USING btree (blocknumber);


--
-- Name: users_is_available_false_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_is_available_false_idx ON public.users USING btree (is_available) WHERE (is_available = false);


--
-- Name: challenge_disbursements on_challenge_disbursement; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_challenge_disbursement AFTER INSERT ON public.challenge_disbursements FOR EACH ROW EXECUTE PROCEDURE public.handle_challenge_disbursement();


--
-- Name: follows on_follow; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_follow AFTER INSERT ON public.follows FOR EACH ROW EXECUTE PROCEDURE public.handle_follow();


--
-- Name: plays on_play; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_play AFTER INSERT ON public.plays FOR EACH ROW EXECUTE PROCEDURE public.handle_play();


--
-- Name: playlists on_playlist; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_playlist AFTER INSERT ON public.playlists FOR EACH ROW EXECUTE PROCEDURE public.handle_playlist();


--
-- Name: reactions on_reaction; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_reaction AFTER INSERT ON public.reactions FOR EACH ROW EXECUTE PROCEDURE public.handle_reaction();


--
-- Name: reposts on_repost; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_repost AFTER INSERT ON public.reposts FOR EACH ROW EXECUTE PROCEDURE public.handle_repost();


--
-- Name: saves on_save; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_save AFTER INSERT ON public.saves FOR EACH ROW EXECUTE PROCEDURE public.handle_save();


--
-- Name: supporter_rank_ups on_supporter_rank_up; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_supporter_rank_up AFTER INSERT ON public.supporter_rank_ups FOR EACH ROW EXECUTE PROCEDURE public.handle_supporter_rank_up();


--
-- Name: tracks on_track; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_track AFTER INSERT OR UPDATE ON public.tracks FOR EACH ROW EXECUTE PROCEDURE public.handle_track();


--
-- Name: users on_user; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_user AFTER INSERT ON public.users FOR EACH ROW EXECUTE PROCEDURE public.handle_user();


--
-- Name: user_balance_changes on_user_balance_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_user_balance_changes AFTER INSERT OR UPDATE ON public.user_balance_changes FOR EACH ROW EXECUTE PROCEDURE public.handle_user_balance_change();


--
-- Name: user_tips on_user_tip; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_user_tip AFTER INSERT ON public.user_tips FOR EACH ROW EXECUTE PROCEDURE public.handle_user_tip();


--
-- Name: aggregate_plays trg_aggregate_plays; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_aggregate_plays AFTER INSERT OR UPDATE ON public.aggregate_plays FOR EACH ROW EXECUTE PROCEDURE public.on_new_row();


--
-- Name: aggregate_user trg_aggregate_user; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_aggregate_user AFTER INSERT OR UPDATE ON public.aggregate_user FOR EACH ROW EXECUTE PROCEDURE public.on_new_row();


--
-- Name: follows trg_follows; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_follows AFTER INSERT OR UPDATE ON public.follows FOR EACH ROW EXECUTE PROCEDURE public.on_new_row();


--
-- Name: playlists trg_playlists; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_playlists AFTER INSERT OR UPDATE ON public.playlists FOR EACH ROW EXECUTE PROCEDURE public.on_new_row();


--
-- Name: reposts trg_reposts; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_reposts AFTER INSERT OR UPDATE ON public.reposts FOR EACH ROW EXECUTE PROCEDURE public.on_new_row();


--
-- Name: saves trg_saves; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_saves AFTER INSERT OR UPDATE ON public.saves FOR EACH ROW EXECUTE PROCEDURE public.on_new_row();


--
-- Name: tracks trg_tracks; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tracks AFTER INSERT OR UPDATE ON public.tracks FOR EACH ROW EXECUTE PROCEDURE public.on_new_row();


--
-- Name: users trg_users; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_users AFTER INSERT OR UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE public.on_new_row();


--
-- Name: app_delegates app_delegates_blockhash_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_delegates
    ADD CONSTRAINT app_delegates_blockhash_fkey FOREIGN KEY (blockhash) REFERENCES public.blocks(blockhash);


--
-- Name: app_delegates app_delegates_blocknumber_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_delegates
    ADD CONSTRAINT app_delegates_blocknumber_fkey FOREIGN KEY (blocknumber) REFERENCES public.blocks(number);


--
-- Name: chat_member chat_member_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_member
    ADD CONSTRAINT chat_member_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chat(chat_id);


--
-- Name: chat_message_reactions chat_message_reactions_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_message_reactions
    ADD CONSTRAINT chat_message_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_message(message_id);


--
-- Name: delegations delegations_blockhash_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delegations
    ADD CONSTRAINT delegations_blockhash_fkey FOREIGN KEY (blockhash) REFERENCES public.blocks(blockhash);


--
-- Name: delegations delegations_blocknumber_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delegations
    ADD CONSTRAINT delegations_blocknumber_fkey FOREIGN KEY (blocknumber) REFERENCES public.blocks(number);


--
-- Name: chat_message fk_chat_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_message
    ADD CONSTRAINT fk_chat_member FOREIGN KEY (chat_id, user_id) REFERENCES public.chat_member(chat_id, user_id);


--
-- Name: user_challenges user_challenges_challenge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_challenges
    ADD CONSTRAINT user_challenges_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id);


--
-- PostgreSQL database dump complete
--

