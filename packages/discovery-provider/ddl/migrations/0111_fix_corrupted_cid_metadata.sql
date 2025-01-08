BEGIN;

DO $$
DECLARE
    record RECORD;
BEGIN
    -- run only on prod
    IF EXISTS (SELECT * FROM "blocks" WHERE "blockhash" = '0x8d5e6984014505e1e11bcbb1ca1a13bcc6ae85ac74014710a73271d82ca49f01') THEN

        FOR record IN SELECT * FROM (VALUES
            (1,'bagaaieraonvo2zwl5lnfbtunf2cqqkunkru2p2qrk6ic6l3cdbc6pl3cx57q','bagaaiera5cxdtklhdhqdsse5w2anuh5klahjwk3qiplzgyni6gjnvpve22da'),
            (5233,'bagaaierayf4xesyf4ff7ijyk4dnd7waccwjxuje3wck6dv2wrwhcwjagbvaq','bagaaieramprametuwklwec4lcokscom6fx5awwwjldlxzqarlrresil7zkkq'),
            (29401,'bagaaieraztef65rwgkdedwavvditoefydim57txdgryamanwtw35ldm5hbba','bagaaierauwlynmsux52ttsvxmmdjnkwc5vaqkbcqoeyglzr6etawa7dmuosa'),
            (57441,'bagaaierazkzjwxq5pe5hvfiwh5bp2njmz63isth5t77htc6ekbqxyjktlc4q','QmcdUYBY2CriSpMpAGSYPezrXBDVReRV2xqErXe9ptnJEf'),
            (63055,'bagaaieransu3gqid5w2efgwwsl6a6llnxtbb4dxp77dahmg53pg3iyyaelqq','bagaaierattwiyesj4hu7jnfw6je5xefu24sefrd7dln3drxhzhluuuwn7nka'),
            (91337,'bagaaieratotfw7x4fdpk5mhzrpuicomdbhqvaulcvomedumnn5kuwsxt2vqa','bagaaierafoqhaoxi6sdqutxjbmjc23disnifeieyixh73pan2ftmc4q64h3a'),
            (103927,'bagaaieraqqgblvjkiaz5oh6pogp3ir7bbn3glsiddoeih5r6i7h4adwpfrgq','bagaaierarfqjsnxh3w45si7okvsy5uwqmre7sdmncp62f523zierqza73lba'),
            (105879,'bagaaieramuer5ephyjzkqoosnjphjgofwsgex7nb5tqnykz2y6dzwsnwrk7a','bagaaiera4cjbuysvnwdnow457pt5qrmvcha3wt5oigpxvpku735lwzulyzwq'),
            (147204,'bagaaierayy4xts2wnjeo374pjy7cxx46jmsou56upqanfuhu3zt5uv4qfwwa','bagaaierarui5yy4fc4ibj5nhlalkpmwfssvmcogmim25upcd7egfkf2uedsa'),
            (150707,'bagaaiera2q6r4idakym5ccj6rfcqedfl6emcqkhpxkc2gjv66gd3azq67hlq','bagaaieral2nnesgwipl33c3uhybpp6uxcmgmmtokqbi435kar2jqoaruc2zq'),
            (309102,'bagaaiera7xuq4x3wjf5dq5rnbuqipw3phk4up2q26uyvfyvqvle2rn25ufxq','bagaaieraxwegxh72esfuuev5rqv6mvr25nxwc6eaagclbzrvxa4mcmhqnsuq'),
            (348740,'bagaaierakh4b7jc2dmeg6rqase2l55haafns5tbdepc7a3ybcb3brrevlubq','bagaaiera3qhti4ic3pzoinwj5ltivs6v4jtls3ygt2hpzhhstca7eprl5n6a'),
            (484007,'bagaaiera4q2ekjcjmnbasxhu4stbe2jhj3g26pgpns4yweofhmw4mecmzssq','bagaaierazhf7eircsljzd3i7uphkspvpqzlzrteyx5mxxjuhuxzap3mzfyeq'),
            (535883,'bagaaieraowo5u6czo7zl7o3pmpntkqk566zln53dve2k77mcfol3yxmzpv6q','bagaaieraykutnulm3alrlvd7gkoiedxydhurxlpu55api7q5icd6qxjf7bua'),
            (1271268,'bagaaiera7amaanbbwpzg4tv6hc43f3kp4mb32ohfbc4wkg6maqkwpr73nmta','bagaaierahk5ltyeewjyeeoczltqq66xlipi3yugzh4hiagcztbty23rk7fdq'),
            (1414776,'bagaaiera5sdistpfhoxtwnj3t5kjyimm7ahj3kcvcabwbobs72peeauipqwa','bagaaierawu5dnpcteamqu53u4xrwyyt3osdhcblc4n73kf3anbyvh3a22o5q'),
            (19177768,'bagaaiera6rgmqi3c36seqevmoivk6zkpxl5x6w2wgcel5tfrpmipnpv5eczq','bagaaierajow5uyevmb4xuit4bttagxsa7pw32smipuv22vupzwtrux5tulja'),
            (157221932,'bagaaieran2n5c3ge5tfqfdnlkhh3cegqxvnkfob5ucg4tjoiyyznfkamzqda','bagaaieradwhbcpslnhh5rorexumuzukuuuttpqx2dqg5cgsb4zhaxztcv3oq'),
            (193486862,'bagaaieragaedppg7qsfavn6eainpomrindzfyheguwrw6ji4vcqnzyx4rxya','bagaaiera7e4rkf7gx773jbvzeanwmk3iq5n724a4tgioec2so7cgj7qbvgda'),
            (211618773,'bagaaierazohln7kaivh6fzdwtrmp6pgy6fcb7l2jt5m5nloklhevnw6rsrxq','bagaaieravllbn4x3jqdzbap6wcjxglakthqcfeq35oknmaapbzbegmlqzbaq'),
            (273975188,'bagaaieraryujthfwq2wuy334rn4kwuqymumb4ukcs3vnxjmbtnrclivemkpq','bagaaierapjl23yxw2tysybwtijdb2py4w4cgrtdnzz33fpiezpopu7clgqpa'),
            (333258825,'bagaaierayzcvdfy3vyslv2gp5lz3euyf7fmpmbakoeirenobmoozqfdc4bxq','bagaaieratools7er75q3jmyehszwn2ic6a33rmcdmts74sa6w5vsnj5jei6a'),
            (458118601,'bagaaierala27khopzdxtqvwqosgvx2tpqq6f3i54xbviwdewkz6wjglcv5uq','bagaaiera3mexwju24cdv2b5hkcjb24xklx4cov5ti6lqolwhgdecdy33bwka'),
            (475018419,'bagaaieraaap4vnpca25r5s3u7qrluxhnp542luwythjmcaw2kdofa7qzk5ga','bagaaieracxwy33qgryn4ki4yhu6k5rplrrzy35r47zkmuag72cuarwdvldda'),
            (559657766,'bagaaiera3oodkbwfa7xfjax6difzxjeuhmlt4mxmzjtjxx6czufholgj7e7q','bagaaieraxu5fit7ipb73hnncotxj6iefbzmnqtdmerehisjx4ouqdgipl6za'),
            (757029775,'bagaaieravmn4srznv4agbcrxkuwc7y7qnvkmdmzzsz575ojuld4xeer4d5yq','bagaaierasqwjkb2mwpdy374iavjzyttskzidhjh6rpura6grxlumwvnydq4a'),
            (917592335,'bagaaierafbqvv5iilyosbhbw3i4aqfzavmxhes3wl4xryqwqwagixy3w6daa','bagaaieraqvcuy35rhgi3aexett3kxgx6zq4wumwkthor7kejksyh43qzmviq'))
        AS t(user_id, corrupted_cid, cid)
        LOOP
            UPDATE users
            SET metadata_multihash = record.cid
            -- only replace if record is using the corrupted cid
            WHERE user_id = record.user_id
            AND metadata_multihash = record.corrupted_cid;
        END LOOP;

    END IF;
END $$;

COMMIT;