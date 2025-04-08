begin;

do $$ begin -- run only on prod
if exists (
    select *
    from "blocks"
    where "blockhash" = '0xe9b0f40bb2356d4fbedde96671503475c1c6c994c7eda082f046f7e9923c6e16'
) then
    update user_challenges set amount = 5 where specifier = '40b4:2f05be61' and challenge_id = 'b';
    update user_challenges set amount = 25 where specifier = '349299f5:6ea7268a' and challenge_id = 'b';
    update user_challenges set amount = 5 where specifier = '3708cb78:24743357' and challenge_id = 's';
    update user_challenges set amount = 5 where specifier = '3708cb78:24743357' and challenge_id = 'b';
    update user_challenges set amount = 10 where specifier = '2d9dc50d:11b9de8a' and challenge_id = 'b';
    update user_challenges set amount = 10 where specifier = '2d9dc50d:11b9de8a' and challenge_id = 's';
    update user_challenges set amount = 5 where specifier = 'b07dad:24743357' and challenge_id = 's';
    update user_challenges set amount = 5 where specifier = 'b07dad:24743357' and challenge_id = 'b';
    update user_challenges set amount = 5 where specifier = '40b4:49111325' and challenge_id = 'b';
    update user_challenges set amount = 5 where specifier = '12014ba3:24743357' and challenge_id = 'b';
    update user_challenges set amount = 5 where specifier = '12014ba3:24743357' and challenge_id = 's';
    update user_challenges set amount = 10 where specifier = '40b4:733ac806' and challenge_id = 'b';
    update user_challenges set amount = 5 where specifier = '19bbcc:934fe48' and challenge_id = 'b';
    update user_challenges set amount = 5 where specifier = 'ca6974a:1cd81432' and challenge_id = 'b';
    update user_challenges set amount = 5 where specifier = '128a3ce0:3e900aca' and challenge_id = 'b';
    update user_challenges set amount = 5 where specifier = '128a3ce0:3e900aca' and challenge_id = 's';
    update user_challenges set amount = 5 where specifier = '4:2f05be61' and challenge_id = 'b';
    update user_challenges set amount = 5 where specifier = '1:15d0a' and challenge_id = 'b';
    update user_challenges set amount = 10 where specifier = '72d9:a5a9c83' and challenge_id = 's';
    update user_challenges set amount = 10 where specifier = '72d9:a5a9c83' and challenge_id = 'b';
    update user_challenges set amount = 5 where specifier = '1:2f05be61' and challenge_id = 'b';
    update user_challenges set amount = 55 where specifier = '9df9021:1b84a2ec' and challenge_id = 'b';
    update user_challenges set amount = 25 where specifier = '9df9021:6ea7268a' and challenge_id = 'b';
    update user_challenges set amount = 175 where specifier = '40c87fb:7f9cb28e' and challenge_id = 'b';
    update user_challenges set amount = 100 where specifier = '40c87fb:2db1dc3' and challenge_id = 'b';
    update user_challenges set amount = 85 where specifier = '8e36442:11886bf3' and challenge_id = 'b';
    update user_challenges set amount = 75 where specifier = '40c87fb:69962288' and challenge_id = 'b';
    update user_challenges set amount = 5 where specifier = '3163ad44:80865b7' and challenge_id = 'b';
    update user_challenges set amount = 5 where specifier = '3163ad44:80865b7' and challenge_id = 's';
    update user_challenges set amount = 5 where specifier = '3ce3859:2f05be61' and challenge_id = 'b';
    update user_challenges set amount = 5 where specifier = '3396b:69d86b00' and challenge_id = 'b';
    update user_challenges set amount = 5 where specifier = '2e059070:24743357' and challenge_id = 'b';
    update user_challenges set amount = 5 where specifier = '2e059070:24743357' and challenge_id = 's';
end if;

end $$;

commit;
