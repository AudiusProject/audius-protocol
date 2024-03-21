--- modified from: https://github.com/array-analytics/plpg_hashids


-- our usage of these functions places all of them in a separate schema, with "hashids" being the default name
-- change this or don't use it (but know that the other sql functions will not work out of the box, they are assuming the hashids schema).
DROP SCHEMA IF EXISTS hashids CASCADE;

CREATE SCHEMA hashids;

-- drop all functions out of schema
DROP FUNCTION if exists hashids.consistent_shuffle(text, text);
DROP FUNCTION if exists hashids.clean_seps_from_alphabet(text, text);
DROP FUNCTION if exists hashids.clean_alphabet_from_seps(text, text);
DROP FUNCTION if exists hashids.distinct_alphabet(text);

DROP FUNCTION if exists hashids.setup_alphabet(text, text, text, text);

DROP FUNCTION if exists hashids.hash(bigint, text, boolean);

DROP FUNCTION if exists hashids.unhash(text, text, boolean);

DROP FUNCTION if exists hashids.encode_list(bigint[], text, integer, text, boolean);
DROP FUNCTION if exists hashids.encode_list(bigint[], text, integer, text);
DROP FUNCTION if exists hashids.encode_list(bigint[], text, integer);
DROP FUNCTION if exists hashids.encode_list(bigint[], text);
DROP FUNCTION if exists hashids.encode_list(bigint[]);

DROP FUNCTION if exists hashids.encode(bigint);
DROP FUNCTION if exists hashids.encode(bigint, text);
DROP FUNCTION if exists hashids.encode(bigint, text, integer);
DROP FUNCTION if exists hashids.encode(bigint, text, integer, text);
DROP FUNCTION if exists hashids.encode(bigint, text, integer, text, boolean);

DROP FUNCTION if exists hashids.decode(text, text, integer, text, boolean);
DROP FUNCTION if exists hashids.decode(text, text, integer, text);
DROP FUNCTION if exists hashids.decode(text, text, integer);
DROP FUNCTION if exists hashids.decode(text, text);
DROP FUNCTION if exists hashids.decode(text);

-- constent shuffle
CREATE OR REPLACE FUNCTION hashids.consistent_shuffle
(
	p_alphabet text,
	p_salt text
)
RETURNS text AS
$$
DECLARE p_alphabet ALIAS FOR $1;
	p_salt ALIAS FOR $2;
	v_ls int;
	v_i int;
	v_v int := 0;
	v_p int := 0;
	v_n int := 0;
	v_j int := 0;
	v_temp char(1);
BEGIN

	-- Null or Whitespace?
	IF p_salt IS NULL OR length(LTRIM(RTRIM(p_salt))) = 0 THEN
		RETURN p_alphabet;
	END IF;

	v_ls := length(p_salt);
	v_i := length(p_alphabet) - 1;

	WHILE v_i > 0 LOOP

		v_v := v_v % v_ls;
		v_n := ascii(SUBSTRING(p_salt, v_v + 1, 1)); -- need some investigation to see if +1 here is because of 1 based arrays in sql ... this isn't in the reference JS or .net code.
		v_p := v_p + v_n;
		v_j := (v_n + v_v + v_p) % v_i;
		v_temp := SUBSTRING(p_alphabet, v_j + 1, 1);
		p_alphabet :=
				SUBSTRING(p_alphabet, 1, v_j) ||
				SUBSTRING(p_alphabet, v_i + 1, 1) ||
				SUBSTRING(p_alphabet, v_j + 2, 255);
		p_alphabet :=  SUBSTRING(p_alphabet, 1, v_i) || v_temp || SUBSTRING(p_alphabet, v_i + 2, 255);
		v_i := v_i - 1;
		v_v := v_v + 1;

	END LOOP; -- WHILE

	RETURN p_alphabet;

END;
$$
LANGUAGE plpgsql IMMUTABLE
  COST 200;

-- setup seps
CREATE OR REPLACE FUNCTION hashids.clean_seps_from_alphabet(
	in p_seps text,
	in p_alphabet text
)
  RETURNS text AS
$$
DECLARE
    p_seps ALIAS for $1;
    p_alphabet ALIAS for $2;
    v_split_seps text[] := regexp_split_to_array(p_seps, '');
    v_split_alphabet text[] := regexp_split_to_array(p_alphabet, '');
    v_i integer := 1;
    v_length integer := length(p_seps);
    v_ret text := '';
BEGIN
	-- had to add this function because doing this:
	-- p_seps := array_to_string(ARRAY(select chars.cha from (select unnest(regexp_split_to_array(p_seps, '')) as cha intersect select unnest(regexp_split_to_array(p_alphabet, '')) as cha ) as chars order by ascii(cha) desc), '');
	-- doesn't preserve the order of the input

	for v_i in 1..v_length loop
		-- raise notice 'v_split_seps[%]: %  == %', v_i, v_split_seps[v_i], v_split_seps[v_i] = any (v_split_alphabet);
		if (v_split_seps[v_i] = any (v_split_alphabet)) then
			v_ret = v_ret || v_split_seps[v_i];
		end if;
	end loop;

	-- raise notice 'v_ret: %', v_ret;
	return v_ret;
END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 200;


CREATE OR REPLACE FUNCTION hashids.clean_alphabet_from_seps(
	in p_seps text,
	in p_alphabet text
)
  RETURNS text AS
$$
DECLARE
    p_seps ALIAS for $1;
    p_alphabet ALIAS for $2;
    v_split_seps text[] := regexp_split_to_array(p_seps, '');
    v_split_alphabet text[] := regexp_split_to_array(p_alphabet, '');
    v_i integer := 1;
    v_length integer := length(p_alphabet);
    v_ret text := '';
BEGIN
	-- had to add this function because doing this:
	-- p_alphabet := array_to_string(ARRAY( select chars.cha from (select unnest(regexp_split_to_array(p_alphabet, '')) as cha EXCEPT select unnest(regexp_split_to_array(p_seps, '')) as cha) as chars  ), '');
	-- doesn't preserve the order of the input

	for v_i in 1..v_length loop
		--raise notice 'v_split_alphabet[%]: % != %', v_i, v_split_alphabet[v_i], v_split_alphabet[v_i] <> all (v_split_seps);
		if (v_split_alphabet[v_i] <> all (v_split_seps)) then
			v_ret = v_ret || v_split_alphabet[v_i];
		end if;
	end loop;

	-- raise notice 'v_ret: %', v_ret;
	return v_ret;
END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 200;

CREATE OR REPLACE FUNCTION hashids.distinct_alphabet(in p_alphabet text)
  RETURNS text AS
$$
DECLARE
    p_alphabet ALIAS for $1;
    v_split_alphabet text[] := regexp_split_to_array(p_alphabet, '');
    v_i integer := 2;
    v_length integer := length(p_alphabet);
    v_ret_array text[];
BEGIN
	-- had to add this function because doing this:
	-- p_alphabet := string_agg(distinct chars.split_chars, '') from (select unnest(regexp_split_to_array(p_alphabet, '')) as split_chars) as chars;
	-- doesn't preserve the order of the input, which was causing issues
	if (v_length = 0) then
		RAISE EXCEPTION 'alphabet must contain at least 1 char' USING HINT = 'Please check your alphabet';
	end if;
	v_ret_array := array_append(v_ret_array, v_split_alphabet[1]);

	-- starting at 2 because already appended 1 to it.
	for v_i in 2..v_length loop
		-- raise notice 'v_split_alphabet[%]: % != %', v_i, v_split_alphabet[v_i], v_split_alphabet[v_i] <> all (v_ret_array);

		if (v_split_alphabet[v_i] <> all (v_ret_array)) then
			v_ret_array := array_append(v_ret_array, v_split_alphabet[v_i]);
		end if;
	end loop;

	-- raise notice 'v_ret_array: %', array_to_string(v_ret_array, '');
	return array_to_string(v_ret_array, '');
END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 200;

-- setup alphabet
CREATE OR REPLACE FUNCTION hashids.setup_alphabet(
    in p_salt text default '',
    inout p_alphabet text default 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
    out p_seps text,
    out p_guards text)
AS
$$
DECLARE
    p_salt ALIAS for $1;
    p_alphabet ALIAS for $2;
    p_seps ALIAS for $3;
    p_guards ALIAS for $4;
    v_sep_div float := 3.5;
    v_guard_div float := 12.0;
    v_guard_count integer;
    v_seps_length integer;
    v_seps_diff integer;
BEGIN
    p_seps := 'cfhistuCFHISTU';
    -- p_alphabet := string_agg(distinct chars.split_chars, '') from (select unnest(regexp_split_to_array(p_alphabet, '')) as split_chars) as chars;
		-- this also doesn't preserve the order of alphabet, but it doesn't appear to matter, never mind on that
		p_alphabet := hashids.distinct_alphabet(p_alphabet);


    if length(p_alphabet) < 16 then
        RAISE EXCEPTION 'alphabet must contain 16 unique characters, it is: %', length(p_alphabet) USING HINT = 'Please check your alphabet';
    end if;

    -- seps should only contain character present in the passed alphabet
    -- p_seps := array_to_string(ARRAY(select chars.cha from (select unnest(regexp_split_to_array(p_seps, '')) as cha intersect select unnest(regexp_split_to_array(p_alphabet, '')) as cha ) as chars order by ascii(cha) desc), '');
    -- this doesn't preserve the input order, which is bad
    p_seps := hashids.clean_seps_from_alphabet(p_seps, p_alphabet);

    -- alphabet should not contain seps.
    -- p_alphabet := array_to_string(ARRAY( select chars.cha from (select unnest(regexp_split_to_array(p_alphabet, '')) as cha EXCEPT select unnest(regexp_split_to_array(p_seps, '')) as cha) as chars  ), '');
    -- this also doesn't prevserve the order
    p_alphabet := hashids.clean_alphabet_from_seps(p_seps, p_alphabet);


	p_seps := hashids.consistent_shuffle(p_seps, p_salt);

	if (length(p_seps) = 0) or ((length(p_alphabet) / length(p_seps)) > v_sep_div) then
		v_seps_length := cast( ceil( length(p_alphabet)/v_sep_div ) as integer);
		if v_seps_length = 1 then
			v_seps_length := 2;
		end if;
		if v_seps_length > length(p_seps) then
			v_seps_diff := v_seps_length - length(p_seps);
			p_seps := p_seps || SUBSTRING(p_alphabet, 1, v_seps_diff);
			p_alphabet := SUBSTRING(p_alphabet, v_seps_diff + 1);
		else
			p_seps := SUBSTRING(p_seps, 1, v_seps_length + 1);
		end if;
	end if;

	p_alphabet := hashids.consistent_shuffle(p_alphabet, p_salt);

	v_guard_count := cast(ceil(length(p_alphabet) / v_guard_div ) as integer);

	if length(p_alphabet) < 3 then
		p_guards := SUBSTRING(p_seps, 1, v_guard_count);
		p_seps := SUBSTRING(p_seps, v_guard_count + 1);
	else
		p_guards := SUBSTRING(p_alphabet, 1, v_guard_count);
		p_alphabet := SUBSTRING(p_alphabet, v_guard_count + 1);
	end if;

END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 200;

-- create hash
CREATE OR REPLACE FUNCTION hashids.hash(
    p_input bigint,
    p_alphabet text,
    p_zero_offset boolean DEFAULT true)
  RETURNS text AS
$$
DECLARE
    p_input ALIAS for $1;
    p_alphabet ALIAS for $2;
    p_zero_offset integer := case when $3 = true then 1 else 0 end ; -- adding an offset so that this can work with values from a zero based array language
    v_hash varchar(255) := '';
    v_alphabet_length integer := length($2);
    v_pos integer;
BEGIN

    WHILE 1 = 1 LOOP
        v_pos := (p_input % v_alphabet_length) + p_zero_offset; -- have to add one, because SUBSTRING in SQL starts at 1 instead of 0 (like it does in other languages)
        --raise notice '% mod % == %', p_input, v_alphabet_length, v_pos;
        --raise notice 'SUBSTRING(%, %, 1): %', p_alphabet, v_pos, (SUBSTRING(p_alphabet, v_pos, 1));
        --raise notice '% || % == %', SUBSTRING(p_alphabet, v_pos, 1), v_hash, SUBSTRING(p_alphabet, v_pos, 1) || v_hash;
        v_hash := SUBSTRING(p_alphabet, v_pos, 1) || v_hash;
        p_input := CAST((p_input / v_alphabet_length) as int);
        --raise notice 'p_input %', p_input;
        IF p_input <= 0 THEN
            EXIT;
        END IF;
    END LOOP;

    RETURN v_hash;
END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 250;

-- unhash
CREATE OR REPLACE FUNCTION hashids.unhash(
    p_input text,
    p_alphabet text,
    p_zero_offset boolean DEFAULT true)
  RETURNS bigint AS
$$
DECLARE
    p_input ALIAS for $1;
    p_alphabet ALIAS for $2;
    p_zero_offset integer := case when $3 = true then 1 else 0 end ; -- adding an offset so that this can work with values from a zero based array language
    v_input_length integer := length($1);
    v_alphabet_length integer := length($2);
    v_ret bigint := 0;
    v_input_char char(1);
    v_pos integer;
    v_i integer := 1;
BEGIN
    for v_i in 1..v_input_length loop
        v_input_char := SUBSTRING(p_input, (v_i), 1);
        v_pos := POSITION(v_input_char in p_alphabet) - p_zero_offset; -- have to remove one to interface with .net because it is a zero based index
        --raise notice '%[%] is % to position % in %', p_input, v_i, v_input_char, v_pos, p_alphabet;
        --raise notice '  % + (% * power(%, % - % - 1)) == %', v_ret, v_pos, v_alphabet_length, v_input_length, (v_i - 1), v_ret + (v_pos * power(v_alphabet_length, v_input_length - (v_i-1) - 1));
        v_ret := v_ret + (v_pos * power(v_alphabet_length, v_input_length - (v_i-p_zero_offset) - 1));
    end loop;

    RETURN v_ret;
END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 100;

-- encode list
CREATE OR REPLACE FUNCTION hashids.encode_list(
    in p_numbers bigint[],
    in p_salt text, -- DEFAULT '',
    in p_min_hash_length integer, -- integer default 0,
    in p_alphabet text, -- DEFAULT 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
    in p_zero_offset boolean DEFAULT true)
  RETURNS text AS
$$
    DECLARE
        p_numbers ALIAS for $1;
        p_salt ALIAS for $2;
        p_min_hash_length ALIAS for $3;
        p_alphabet ALIAS for $4;
        p_zero_offset integer := case when $5 = true then 1 else 0 end ; -- adding an offset so that this can work with values from a zero based array language
        v_seps text;
        v_guards text;

        -- Working Data
        v_alphabet text := p_alphabet;
        v_numbersHashInt int = 0;
        v_lottery char(1);
        v_buffer varchar(255);
        v_last varchar(255);
        v_ret varchar(255);
        v_sepsIndex int;
        v_lastId int;
        v_count int = array_length(p_numbers, 1);
        v_i int = 0;
        v_id int = 0;
        v_number int;
        v_guardIndex int;
        v_guard char(1);
        v_halfLength int;
        v_excess int;
BEGIN

    select * from hashids.setup_alphabet(p_salt, p_alphabet) into v_alphabet, v_seps, v_guards;
    --raise notice 'v_seps: %', v_seps;
    --raise notice 'v_alphabet: %', v_alphabet;
    --raise notice 'v_guards: %', v_guards;

    -- Calculate numbersHashInt
    for v_lastId in 1..v_count LOOP
        v_numbersHashInt := v_numbersHashInt + (p_numbers[v_lastId] % ((v_lastId-p_zero_offset) + 100));
    END LOOP;

    -- Choose lottery
    v_lottery := SUBSTRING(v_alphabet, (v_numbersHashInt % length(v_alphabet)) + 1, 1); -- is this a +1 because of sql 1 based index, need to double check to see if can be replaced with param.
    v_ret := v_lottery;

    -- Encode many
    v_i := 0;
    v_id := 0;
    for v_i in 1..v_count LOOP
        v_number := p_numbers[v_i];
        -- raise notice '%[%]: % for %', p_numbers, v_i, v_number, v_count;

        v_buffer := v_lottery || p_salt || v_alphabet;
        v_alphabet := hashids.consistent_shuffle(v_alphabet, SUBSTRING(v_buffer, 1, length(v_alphabet)));
        v_last := hashids.hash(v_number, v_alphabet, cast(p_zero_offset as boolean));
        v_ret := v_ret || v_last;
        --raise notice 'v_ret: %', v_ret;
        --raise notice '(v_i < v_count: % < % == %', v_i, v_count, (v_i < v_count);
        IF (v_i) < v_count THEN
            --raise notice 'v_sepsIndex:  % mod (% + %) == %', v_number, ascii(SUBSTRING(v_last, 1, 1)), v_i, (v_number % (ascii(SUBSTRING(v_last, 1, 1)) + v_i));
            v_sepsIndex := v_number % (ascii(SUBSTRING(v_last, 1, 1)) + (v_i-p_zero_offset)); -- since this is 1 base vs 0 based bringing the number back down so that the mod is the same for zero based records
            v_sepsIndex := v_sepsIndex % length(v_seps);
            v_ret := v_ret || SUBSTRING(v_seps, v_sepsIndex+1, 1);
        END IF;

    END LOOP;

    ----------------------------------------------------------------------------
    -- Enforce minHashLength
    ----------------------------------------------------------------------------
    IF length(v_ret) < p_min_hash_length THEN

        ------------------------------------------------------------------------
        -- Add first 2 guard characters
        ------------------------------------------------------------------------
        v_guardIndex := (v_numbersHashInt + ascii(SUBSTRING(v_ret, 1, 1))) % length(v_guards);
        v_guard := SUBSTRING(v_guards, v_guardIndex + 1, 1);
        --raise notice '% || % is %', v_guard, v_ret, v_guard || v_ret;
        v_ret := v_guard || v_ret;
        IF length(v_ret) < p_min_hash_length THEN
            v_guardIndex := (v_numbersHashInt + ascii(SUBSTRING(v_ret, 3, 1))) % length(v_guards);
            v_guard := SUBSTRING(v_guards, v_guardIndex + 1, 1);
            v_ret := v_ret || v_guard;
        END IF;
        ------------------------------------------------------------------------
        -- Add the rest
        ------------------------------------------------------------------------
        WHILE length(v_ret) < p_min_hash_length LOOP
            v_halfLength := COALESCE(v_halfLength, CAST((length(v_alphabet) / 2) as int));
            v_alphabet := hashids.consistent_shuffle(v_alphabet, v_alphabet);
            v_ret := SUBSTRING(v_alphabet, v_halfLength + 1, 255) || v_ret || SUBSTRING(v_alphabet, 1, v_halfLength);
            v_excess := length(v_ret) - p_min_hash_length;
            IF v_excess > 0 THEN
                v_ret := SUBSTRING(v_ret, CAST((v_excess / 2) as int) + 1, p_min_hash_length);
            END IF;
        END LOOP;
    END IF;
    RETURN v_ret;
END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 350;


CREATE OR REPLACE FUNCTION hashids.encode_list( in p_numbers bigint[] )
  RETURNS text AS
$$
-- Options Data - generated by hashids-tsql
    DECLARE
        p_numbers ALIAS for $1;
        p_salt text := ''; -- default
        p_min_hash_length integer := 0; -- default
        p_alphabet text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'; -- default
        p_zero_offset boolean := true ; -- adding an offset so that this can work with values from a zero based array language
BEGIN
    RETURN hashids.encode_list(p_numbers, p_salt, p_min_hash_length, p_alphabet, p_zero_offset);
END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 300;

CREATE OR REPLACE FUNCTION hashids.encode_list(
  in p_numbers bigint[],
  in p_salt text )
  RETURNS text AS
$$
-- Options Data - generated by hashids-tsql
    DECLARE
        p_numbers ALIAS for $1;
        p_salt ALIAS for $2; -- default
        p_min_hash_length integer := 0; -- default
        p_alphabet text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'; -- default
        p_zero_offset boolean := true ; -- adding an offset so that this can work with values from a zero based array language
BEGIN
    RETURN hashids.encode_list(p_numbers, p_salt, p_min_hash_length, p_alphabet, p_zero_offset);
END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 300;

CREATE OR REPLACE FUNCTION hashids.encode_list(
  in p_numbers bigint[],
  in p_salt text,
  in p_min_hash_length integer )
  RETURNS text AS
$$
-- Options Data - generated by hashids-tsql
    DECLARE
        p_numbers ALIAS for $1;
        p_salt ALIAS for $2; -- default
        p_min_hash_length ALIAS for $3; -- default
        p_alphabet text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'; -- default
        p_zero_offset boolean := true ; -- adding an offset so that this can work with values from a zero based array language
BEGIN
    RETURN hashids.encode_list(p_numbers, p_salt, p_min_hash_length, p_alphabet, p_zero_offset);
END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 300;

-- encode
CREATE OR REPLACE FUNCTION hashids.encode(in p_number bigint)
  RETURNS text AS
$$
DECLARE
    p_number ALIAS for $1;
    p_salt text := ''; -- default
    p_min_hash_length integer := 0; -- default
    p_alphabet text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'; -- default
    p_zero_offset boolean := true ; -- adding an offset so that this can work with values from a zero based array language
BEGIN
    RETURN hashids.encode_list(ARRAY[p_number::bigint]::bigint[], p_salt, p_min_hash_length, p_alphabet, p_zero_offset);
END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 300;


CREATE OR REPLACE FUNCTION hashids.encode(
  in p_number bigint,
  in p_salt text)
  RETURNS text AS
$$
DECLARE
    p_number ALIAS for $1;
    p_salt ALIAS for $2;
    p_min_hash_length integer := 0; -- default
    p_alphabet text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'; -- default
    p_zero_offset boolean := true ; -- adding an offset so that this can work with values from a zero based array language
BEGIN
    RETURN hashids.encode_list(ARRAY[p_number::bigint]::bigint[], p_salt, p_min_hash_length, p_alphabet, p_zero_offset);
END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 300;


CREATE OR REPLACE FUNCTION hashids.encode(
  in p_number bigint,
  in p_salt text,
  in p_min_hash_length integer)
  RETURNS text AS
$$
DECLARE
    p_number ALIAS for $1;
    p_salt ALIAS for $2;
    p_min_hash_length ALIAS for $3; -- default
    p_alphabet text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'; -- default
    p_zero_offset boolean := true ; -- adding an offset so that this can work with values from a zero based array language
BEGIN
    RETURN hashids.encode_list(ARRAY[p_number::bigint]::bigint[], p_salt, p_min_hash_length, p_alphabet, p_zero_offset);
END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 300;

CREATE OR REPLACE FUNCTION hashids.encode(
  in p_number bigint,
  in p_salt text,
  in p_min_hash_length integer,
  in p_alphabet text)
  RETURNS text AS
$$
DECLARE
    p_number ALIAS for $1;
    p_salt ALIAS for $2;
    p_min_hash_length ALIAS for $3; -- default
    p_alphabet ALIAS for $4; -- default
    p_zero_offset boolean := true ; -- adding an offset so that this can work with values from a zero based array language
BEGIN
    RETURN hashids.encode_list(ARRAY[p_number::bigint]::bigint[], p_salt, p_min_hash_length, p_alphabet, p_zero_offset);
END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 300;

CREATE OR REPLACE FUNCTION hashids.encode(
  in p_number bigint,
  in p_salt text,
  in p_min_hash_length integer,
  in p_alphabet text,
  in p_zero_offset boolean)
  RETURNS text AS
$$
DECLARE
    p_number ALIAS for $1;
    p_salt ALIAS for $2;
    p_min_hash_length ALIAS for $3; -- default
    p_alphabet ALIAS for $4; -- default
    p_zero_offset ALIAS for $5 ; -- adding an offset so that this can work with values from a zero based array language
BEGIN
    RETURN hashids.encode_list(ARRAY[p_number::bigint]::bigint[], p_salt, p_min_hash_length, p_alphabet, p_zero_offset);
END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 300;

-- decode
CREATE OR REPLACE FUNCTION hashids.decode(
    in p_hash text,
    in p_salt text,
    in p_min_hash_length integer,
    in p_alphabet text,
    p_zero_offset boolean DEFAULT true)
  RETURNS bigint[] AS
$$
DECLARE
    p_hash ALIAS for $1;
    p_salt ALIAS for $2;
    p_min_hash_length ALIAS for $3;
    p_alphabet ALIAS for $4;
    p_zero_offset ALIAS for $5; -- adding an offset so that this can work with values from a zero based array language

    v_seps text;
    v_guards text;
    v_alphabet text := p_alphabet;
    v_lottery char(1);

    v_hashBreakdown varchar(255);
    v_hashArray text[];
    v_index integer := 1;
    v_j integer := 1;
    v_hashArrayLength integer;
    v_subHash varchar;
    v_buffer varchar(255);
    v_encodeCheck varchar(255);
    v_ret_temp bigint;
    v_ret bigint[];
BEGIN

    select * from hashids.setup_alphabet(p_salt, v_alphabet) into v_alphabet, v_seps, v_guards;
    --raise notice 'v_seps: %', v_seps;
    --raise notice 'v_alphabet: %', v_alphabet;
    --raise notice 'v_guards: %', v_guards;

    v_hashBreakdown := regexp_replace(p_hash, '[' || v_guards || ']', ' ');
    v_hashArray := regexp_split_to_array(p_hash, '[' || v_guards || ']');

    -- take the guards and replace with space,
    -- split on space
    -- if length is 3 or 2, set index to 1 else start at zero

    -- if first index in idBreakDown isn't default

    if ((array_length(v_hashArray, 1) = 3) or (array_length(v_hashArray, 1) = 2)) then
        v_index := 2; -- in the example code (C# and js) it is 1 here, but postgresql arrays start at 1, so switching to 2
    END IF;
    --raise notice '%', v_hashArray;

    v_hashBreakdown := v_hashArray[v_index];
    --raise notice 'v_hashArray[%] %', v_index, v_hashBreakdown;
    if (left(v_hashBreakdown, 1) <> '') IS NOT false then
        v_lottery := left(v_hashBreakdown, 1);
        --raise notice 'v_lottery %', v_lottery;
        --raise notice 'SUBSTRING(%, 2, % - 1) %', v_hashBreakdown, length(v_hashBreakdown), SUBSTRING(v_hashBreakdown, 2);

        v_hashBreakdown := SUBSTRING(v_hashBreakdown, 2);
        v_hashArray := regexp_split_to_array(v_hashBreakdown, '[' || v_seps || ']');
        --raise notice 'v_hashArray % -- %', v_hashArray, array_length(v_hashArray, 1);
        v_hashArrayLength := array_length(v_hashArray, 1);
        for v_j in 1..v_hashArrayLength LOOP
            v_subHash := v_hashArray[v_j];
            --raise notice 'v_subHash %', v_subHash;
            v_buffer := v_lottery || p_salt || v_alphabet;
            --raise notice 'v_buffer %', v_buffer;
            --raise notice 'v_alphabet: hashids.consistent_shuffle(%, %) == %', v_alphabet, SUBSTRING(v_buffer, 1, length(v_alphabet)), hashids.consistent_shuffle(v_alphabet, SUBSTRING(v_buffer, 1, length(v_alphabet)));
            v_alphabet := hashids.consistent_shuffle(v_alphabet, SUBSTRING(v_buffer, 1, length(v_alphabet)));
            v_ret_temp := hashids.unhash(v_subHash, v_alphabet, p_zero_offset);
            --raise notice 'v_ret_temp: %', v_ret_temp;
            v_ret := array_append(v_ret, v_ret_temp);
        END LOOP;
        v_encodeCheck := hashids.encode_list(v_ret, p_salt, p_min_hash_length, p_alphabet, p_zero_offset);
        IF (v_encodeCheck <> p_hash) then
            raise notice 'hashids.encodeList(%): % <> %', v_ret, v_encodeCheck, p_hash;
            return ARRAY[]::bigint[];
        end if;
    end if;

    RETURN v_ret;
END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 300;


CREATE OR REPLACE FUNCTION hashids.decode( in p_hash text )
  RETURNS bigint[] AS
$$
    DECLARE
        p_numbers ALIAS for $1;
        p_salt text := ''; -- default
        p_min_hash_length integer := 0; -- default
        p_alphabet text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'; -- default
        p_zero_offset boolean := true ; -- adding an offset so that this can work with values from a zero based array language
BEGIN
    RETURN hashids.decode(p_hash, p_salt, p_min_hash_length, p_alphabet, p_zero_offset);
END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 300;

CREATE OR REPLACE FUNCTION hashids.decode(
  in p_hash text,
  in p_salt text)
  RETURNS text AS
$$
    DECLARE
        p_numbers ALIAS for $1;
        p_salt ALIAS for $2; -- default
        p_min_hash_length integer := 0; -- default
        p_alphabet text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'; -- default
        p_zero_offset boolean := true ; -- adding an offset so that this can work with values from a zero based array language
BEGIN
    RETURN hashids.decode(p_hash, p_salt, p_min_hash_length, p_alphabet, p_zero_offset);
END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 300;

CREATE OR REPLACE FUNCTION hashids.decode(
  in p_hash text,
  in p_salt text,
  in p_min_hash_length integer)
  RETURNS bigint[] AS
$$
    DECLARE
        p_numbers ALIAS for $1;
        p_salt ALIAS for $2; -- default
        p_min_hash_length ALIAS for $3; -- default
        p_alphabet text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'; -- default
        p_zero_offset boolean := true ; -- adding an offset so that this can work with values from a zero based array language
BEGIN
    RETURN hashids.decode(p_hash, p_salt, p_min_hash_length, p_alphabet, p_zero_offset);
END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 300;

CREATE OR REPLACE FUNCTION hashids.decode(
  in p_hash text,
  in p_salt text,
  in p_min_hash_length integer,
  in p_alphabet text)
  RETURNS bigint[] AS
$$
    DECLARE
        p_numbers ALIAS for $1;
        p_salt ALIAS for $2; -- default
        p_min_hash_length ALIAS for $3; -- default
        p_alphabet ALIAS for $4; -- default
        p_zero_offset boolean := true ; -- adding an offset so that this can work with values from a zero based array language
BEGIN
    RETURN hashids.decode(p_hash, p_salt, p_min_hash_length, p_alphabet, p_zero_offset);
END;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 300;

-- CREATE OR REPLACE FUNCTION hashids.decode(
--   in p_hash text,
--   in p_salt text,
--   in p_min_hash_length integer,
--   in p_alphabet text,
--   in p_zero_offset boolean DEFAULT true)
--   RETURNS bigint[] AS
-- $$
--     DECLARE
--         p_numbers ALIAS for $1;
--         p_salt ALIAS for $2; -- default
--         p_min_hash_length ALIAS for $3; -- default
--         p_alphabet ALIAS for $4; -- default
--         p_zero_offset ALIAS for $5 ; -- adding an offset so that this can work with values from a zero based array language
-- BEGIN
--     RETURN hashids.decode(p_hash, p_salt, p_min_hash_length, p_alphabet, p_zero_offset);
-- END;
-- $$
--   LANGUAGE plpgsql IMMUTABLE
--   COST 300;




-- audius specific

drop function if exists id_decode;
drop function if exists id_encode;

create or replace function id_decode(in p_id text) returns integer as
$$
begin
  return (hashids.decode(p_id, 'azowernasdfoia', 5))[1]::integer;
end;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 300;

create or replace function id_encode(in p_id integer) returns text as
$$
begin
  return hashids.encode(p_id, 'azowernasdfoia', 5);
end;
$$
  LANGUAGE plpgsql IMMUTABLE
  COST 300;

