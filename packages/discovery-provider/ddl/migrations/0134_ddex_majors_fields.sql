begin;

-- no ai use
-- note no standard ddex field
alter table tracks
add column if not exists no_ai_use boolean default false;

-- parental warning
-- https://kb.ddex.net/implementing-each-standard/best-practices-for-all-ddex-standards/guidance-on-releaseresourcework-metadata/parental-advice-labels/
do $$
begin
    if not exists (select 1 from pg_type where typname = 'parental_warning_type') then
        create type parental_warning_type as enum (
            'explicit',
            'explicit_content_edited',
            'not_explicit',
            'no_advice_available'
        );
    end if;
end$$;

alter table tracks
add column if not exists parental_warning parental_warning_type;

-- territory codes
-- https://kb.ddex.net/implementing-each-standard/best-practices-for-all-ddex-standards/guidance-on-identifiers,-iso-codes-lists-and-dates/territory-codes-using-iso-3166-1-or-iso-3166-3-or-tis/
alter table tracks
add column if not exists territory_codes text[];

create or replace function validate_territory_codes(codes text[])
returns boolean as $$
begin
    -- null is valid
    if codes is null then
        return true;
    end if;
    
    -- array must have at least one element
    if array_length(codes, 1) is null then
        return false;
    end if;
    
    -- check each element to make sure it's a 2 letter ISO code
    for i in 1..array_length(codes, 1) loop
        if codes[i] !~ '^[A-Z]{2}$' then
            return false;
        end if;
    end loop;
    
    return true;
end;
$$ language plpgsql;

alter table tracks
add constraint check_territory_codes 
check (validate_territory_codes(territory_codes));

commit;
