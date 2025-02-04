BEGIN;

-- Add unique constraint to prevent duplicates on user_id, wallet, chain
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'associated_wallets'::regclass
        AND conname = 'unique_user_wallet_chain'
    ) THEN
        ALTER TABLE associated_wallets
        ADD CONSTRAINT unique_user_wallet_chain UNIQUE (user_id, wallet, chain);
    END IF;
END $$;

-- Insert pre-validated associated wallets that were missed in indexing
DO $$ BEGIN
-- prod gate
IF EXISTS (SELECT * FROM "blocks" WHERE "blockhash" = '0x8d5e6984014505e1e11bcbb1ca1a13bcc6ae85ac74014710a73271d82ca49f01') THEN
    INSERT INTO associated_wallets
        (user_id, wallet, blockhash, blocknumber, is_current, is_delete, chain)
    VALUES
        (746852926, '7TQtHGtqma3Yb4YrZnAkhvgM1SVsDzUCKq5vvnJhpKf8', '0x1ed77584ed4bd2ae1c0963c84539229b9141c49ce09c7d33470a17d570878a6c', 82893552, true, false, 'sol'),
        (91337, '0x9EA5F5B7640Ea6B8dB371bDa99Cb03E2e558890f', '0x44731b93483f5aac48bc94eab672bc13da05dd82710cf9f851de6e87a4681b8b', 87178837, true, false, 'eth'),
        (91337, '0xd6Fb57d9ee0871c900c827458Aaa64c40dA7Bd68', '0x44731b93483f5aac48bc94eab672bc13da05dd82710cf9f851de6e87a4681b8b', 87178837, true, false, 'eth'),
        (91337, 'EaiyAqryo7Mdp1o3dvC3SnqPnyPd4mh5mcByghRi186n', '0x44731b93483f5aac48bc94eab672bc13da05dd82710cf9f851de6e87a4681b8b', 87178837, true, false, 'sol'),
        (962937045, 'A1WaddpoKxwgWYEgsrLcQ4kn7d7d1CVAKN6QVyiM5svK', '0x803e50f6197f9cb98305cea20ff74f38f67e45b2f62eeb90744c74f79f637c3c', 83023696, true, false, 'sol'),
        (475018419, '0x522cA31A1a4fe77F6DA7959975ce0fc233B14941', '0xf15916e31f8ed086ddc01b233e81d547412a53bd3459e51434350c14047dbb87', 87453290, true, false, 'eth'),
        (291877927, '5HirGt6cEfvvS9ELTTvHnWSc3f9bZ36DiSyQRQnbhddZ', '0x5bd3108cc70639058ab5e80d35efd7a8f2fe597bb5e0d9a5ab92c30c7f93bc70', 45800168, true, false, 'sol'),
        (459894363, 'EirT4qzeDys4LoDmhSFT46DKi1jmaTy23Hrz5EjwfK4x', '0xe451a6ba9437296e5582ad4ff31212d8769e3d908c2853c4aaa2258bd8b69783', 82896377, true, false, 'sol'),
        (147204, '3BGzrzrDG4iFewJsakUz5xdQTvjtgsaEub7RdKne3exU', '0x2c14960df8b6a832784b62d7a13d1bb9070c297ca4e2d12c2528fd41304e74bc', 87346412, true, false, 'sol'),
        (8394780, '94y9vBcTu9w8tqP4Y2nVnGYW5XYv6PkzuUe86Ako3roj', '0x16e4ee551ee035098453f1f905f9351f52d1e954dd219f4c556ab58b5d7f4ffb', 67775024, true, false, 'sol'),
        (351965, '0x3DD072966F657320B666B566b5E215AA94BDD014', '0x45e4114a8e6282e323507664a892f8029d6a1d693529b7c1cc64e12545b17cf3', 45951776, true, false, 'eth'),
        (70052271, 'AjbBppT1vpY2kASjSnFYFJAG2QuJFH5dcwCaoYb7XAmx', '0xf6db21fb90cd241d757c404ee8f1d14171245820072a57d1e285fa688fb549f4', 82846812, true, false, 'sol'),
        (5233, '0xa4A4Efe54D20887eC260a6e1C33082cC06435a42', '0x517ca6a49842eb88a8f033a8ca6b9368af4f2ce5281301cd9a1f8969ad8d1240', 88221352, true, false, 'eth'),
        (103927, '0x6Cc0B5508d41c951050a4E371473CeD2cFf7382f', '0x5371fb32e3bf5a5c4d2991909ab0425186fb16ae4a02b8471a9c82e62fa2bdf3', 87479460, true, false, 'eth'),
        (103927, '0xD2929d236ea51e5685D254F70CaE6a4411EE5d35', '0x5371fb32e3bf5a5c4d2991909ab0425186fb16ae4a02b8471a9c82e62fa2bdf3', 87479460, true, false, 'eth'),
        (103927, 'BzLksVLsAMjrsSPsFhTRYXHGV2JhAZeukeYvM5qvVwJ1', '0x5371fb32e3bf5a5c4d2991909ab0425186fb16ae4a02b8471a9c82e62fa2bdf3', 87479460, true, false, 'sol'),
        (63055, '0xbDEB2F4a6CFF9cb09e2fDFd3dFeB21cc9cf12c8f', '0xfda313d7b0e96dddc439713ac5e06bf856f9484d7d25c836ebf746c8ceb5b658', 87109189, true, false, 'eth'),
        (63055, 'GazFV87TLvNLRuFK7QksnxK6KUamB1Xh43cpymrfkNZw', '0xfda313d7b0e96dddc439713ac5e06bf856f9484d7d25c836ebf746c8ceb5b658', 87109189, true, false, 'sol'),
        (16178, '6ikyWkD6WqHnuW1F6MZjQHnPzXWb2AVvmYZCTkvd8END', '0xc3a14fc50d37bfeabb26b97d1dac87be2082d1f570d86de3911d62c6d6e788dd', 79534734, true, false, 'sol'),
        (868573140, 'CE7JPu4a8hV1RtVPrqoPHgr9wmXcxZdFnfnBdoL5M4wW', '0x9c7fe01bfd85ebf4134820ff888b7760cd1f32c4eed2ebff6c737f1ff49aa55b', 85362121, true, false, 'sol'),
        (10373, 'DdwFLWK1p9xteAFoG78QGQEMce3ZbMhH2nkTvvCexXXQ', '0x3d1e4a4d1dfd9f0c5bfad61d76947177777f195ba83c66cc0171ccb7fb3eaa0f', 67158885, true, false, 'sol'),
        (23481257, '6uCVgdRHGnBhTFEj5AQXGN2BsvSB9fRM9TH17KEbQLis', '0xb14470195852216e3a7b3777c468a7410192601f62bdd25bb430e7f79d395799', 85443839, true, false, 'sol'),
        (228948, 'FAmNgvfr53bTzARstvJ2WWVD88okFk5EHAmwQ1a7CTC2', '0xaab3ed235e4ac519d394e2198e57c92e9a49443f341cc9961fdd9150ae9905fc', 40097134, true, false, 'sol'),
        (333258825, '0x7C65e372Bdb53a4710B2eC0A6c5Bf6950fe49Bcc', '0x8e750b6cd90cc3806f9ad5430f99dafdc1cad1dd7afeaad5cff9711ddea73094', 87785245, true, false, 'eth'),
        (333258825, '7Vfz44tuYJF9qBViDbkqtg4JrofMNwu5JWPDCTGfQfKk', '0x8e750b6cd90cc3806f9ad5430f99dafdc1cad1dd7afeaad5cff9711ddea73094', 87785245, true, false, 'sol'),
        (1839414, 'GrmiC6Us6rpfjmkiK3JzMmoVpdF2GyEzooSSgsWQdgpL', '0xf53a83ef4a3a79f39627cbb1744166b37f8f076a919eae56439cf45bcd00d09c', 40088696, true, false, 'sol'),
        (1923836, 'BFyS7E8R1MjaWNX6unngVPUZJC5MWMvqKuFnbkDy9Sog', '0x51924c889e0d4a4a3dd60cbc1c4575ba4830fffb1aa0ee39481abcb6e50006e8', 29976473, true, false, 'sol'),
        (1271268, '0x11Fd553E4a45Ba764c8bb5f61A63a5F2e841B871', '0x2ccde0f15a3b8355ad3d2c5e742b0ecc333c3f6657e003b5f3dac38d3160c815', 87522394, true, false, 'eth'),
        (1856035, '7Bd7vaDcchd5KJnwQjAFrC57hbCL8KtE7bW8tvwHfqwe', '0x4607c5bf890d483e800ccbf99e2d0a46acf4fb300ef95059c07894a1c5327622', 31067594, true, false, 'sol'),
        (1725318, 'HxZqwydL7hojZZVmecY5dp4ijJhniEceu4hG2dGz5Yq9', '0x24505fd3f1463c1f25872abcf88b77e6585424b9398a40799a1b768d1319ea43', 37383026, true, false, 'sol'),
        (1868187, 'HgwDbwmfQTq3GHQbivzbf9w7kbLcndUpc5EU6keQJq3G', '0x8319e3bfc753b818ff54faafce05cb90e7d2efd8001e2fa0f2752d0330cf157c', 31041400, true, false, 'sol'),
        (1413606, '6AqQHmqDsFY3bPbW48d8yYgUHLAvBRPh4KX42Go1xRsq', '0xca6c43b5d6a76152f86db26f3b12205868d90df530a327ba6a86de7957a44dcb', 37353387, true, false, 'sol'),
        (1888802, '64N43nC2djXNgt22D5SbQeBZT6b8GKRCM9f8Z9Pk83pf', '0xc92a58bc446ef62c1ff80f9e8b2989cc131a2f1a53efeae53b828b8f5ea709dd', 29796703, true, false, 'sol'),
        (650696297, '3awf26thL6xBSFsXrjZzaWKAsHix7yxsEhwdHTKGDLww', '0x440d4ac2148b4a8b15321777a176f6dfaa2951d4608e3378814d4006d9c05eba', 78729800, true, false, 'sol'),
        (6644, '2ZhzReMxkkgrJ5ypZJwvzKZY99bwKxEzcJupubYmpKi6', '0x9e0e79a97233a99880f0a80bdb826490c84cbd74b6565cde643a4a17e8dd6c77', 71139450, true, false, 'sol'),
        (592858643, 'GManhHmTqoauTp7HUmMX2qrnsyQHFfEUxqC5dfaYsMCG', '0xcc9f0b22ab43b17c0c8cc6511403d7dbb0767bf5713abd175cfe2d9f5a729822', 82917651, true, false, 'sol'),
        (484007, '0x52AaBdE9f3Ac668FDaE4348e6c21993598D0ED97', '0x35900da4ee6f99f26a8ad59211b41ef64d979cd467526257a5c2b5b4ec59b16f', 87377954, true, false, 'eth'),
        (484007, '9XNyWLqtfWDfrM86y5tJpxciTHXxryhfxzmAt5webKBN', '0x35900da4ee6f99f26a8ad59211b41ef64d979cd467526257a5c2b5b4ec59b16f', 87377954, true, false, 'sol'),
        (484007, 'F3jMyNVKuqjjMFecDtPDhd2KksYd64aAatnPRJ3e74xR', '0x35900da4ee6f99f26a8ad59211b41ef64d979cd467526257a5c2b5b4ec59b16f', 87377954, true, false, 'sol'),
        (157221932, '0x019Ed608dD806b80193942F2A960e7AC8aBb2EE3', '0x9c5c886b1623d7f531e2da86c2a831c64d8adc7fa5b0f56c88e8335b90ebccb4', 87690187, true, false, 'eth'),
        (157221932, 'Fvr8D87h27nqHUSLZNkirCJpF2ighfKxWkWCYnejM5kQ', '0x9c5c886b1623d7f531e2da86c2a831c64d8adc7fa5b0f56c88e8335b90ebccb4', 87690187, true, false, 'sol'),
        (1427613, '6QHgEGPhvY7n4e2sAAh8f7Q2N5dEBbJ2zkxZbbMqSNFN', '0x07d7de28ecf9ac584032a812e4ed7f90533d1d54814609b5d95eecd785faf72d', 28379224, true, false, 'sol'),
        (544517023, '49jYqgV8jvG7MhYMp4F9BYRhjBZV93gQi1PFEwXqknKd', '0x33ee5a8bdf2adec4a61f1f2b2ac3513cbf467e9c655059b4b54b5de31d818777', 85485189, true, false, 'sol'),
        (72224917, 'GbEWsQ8dR3yeKpapEKHNwS165k5mU8at8AbZHuZ7wmk1', '0xc13d3e5d3588a0c2d373e63d4e37f31bdc74482d0c6d11e76ad801ef70f8f7da', 85380062, true, false, 'sol'),
        (19177768, 'Js7wWk7RRLw2UxzyCDzQ7U6B6VHEXNyEy1hXVPPgC1A', '0x9b08cc7443c33425ff3b2fedb3e72aa4f30ef2f7c01043b5c5bb4e6cd177e3c6', 87711935, true, false, 'sol'),
        (430155592, 'SjatXneMY2NMduF8xUX2dPxXG6p47TY17vrEquNaDXh', '0x5a07d691f346d81c7d68b4b61ddd60e841080c33833ec698922ebf0fa7869ad7', 86756532, true, false, 'sol'),
        (407526533, 'C8VfzhZ88RPP4ijFpD3D92eSBE3ZRD86dvwNcEGvZw54', '0x200c769215228c38b3b309c653d759f78af8a4f9c8fa882abf7a959a0928b1a7', 40814313, true, false, 'sol'),
        (1868644, 'HNEUBtym4TSaBw8TZvXbWMd1KrZXgKZbdXsye2CqHeyB', '0xd36fde77a3e970ffea148ac7a840859058ec34555fddb8a90ba8a982fcac7a75', 37090174, true, false, 'sol'),
        (269492720, 'Bg1Hw4H5sEjZh2Ucsko8c9ccvr4BcYdvpvyQQQkMP9cP', '0x36c3ff4b07b98be940de1ba366586b2c9a2c19cf8cd0b0405ce4aa57d99a4eb6', 68792596, true, false, 'sol'),
        (496706773, 'DJ2pSVnJEcn1DjnY5ponVUZZ2zWQAW8Zs6mvTcyXZBMQ', '0x9b0a3a75cc27787d8bab1630e4341fc79300d5a4c8a1e8cc6ef3eaeb1685dd7a', 62051311, true, false, 'sol'),
        (199474, '0x892e7d0D45171C97F2f1c73815C1cEBEF3D1f812', '0x1de0f87bc0443c6db0268631a94244af1c8ba6b742790cbfdb9684487b7dd29a', 44582922, true, false, 'eth'),
        (28235, 'F9Bs5DB7zMj83bonFkt26sTNNEZAEipuhTY9G1T1D9eU', '0xf496c8f0991b9dece6fab9b3922d24faa3f4fb4cde29585c7c244739310bd41b', 58411440, true, false, 'sol'),
        (273975188, '0xD9C10B10945D85396f0838EA045587a25FD2A2D3', '0x4a6391899bf2f594cca76021f84d5f8f25c8956d51514c9735df13b788993abc', 87494029, true, false, 'eth'),
        (273975188, 'AmfCnJBQQY2rZVv34GPfJrp3Dj6Jt9CD7Edjf8C6fGuQ', '0x4a6391899bf2f594cca76021f84d5f8f25c8956d51514c9735df13b788993abc', 87494029, true, false, 'sol'),
        (535883, '0xFF3d9A1Ecb481891CBe57e5E095bCC964AE4e294', '0xae13d2663a88a6c675cd030ae77ab045128c6a374b0bdcfd646b87d8bf0afcce', 87171422, true, false, 'eth'),
        (535883, 'F84ZgaCWqDJZ79jy8pbqeLbkJ1ADwBYEtoyR1TkdY7yQ', '0xae13d2663a88a6c675cd030ae77ab045128c6a374b0bdcfd646b87d8bf0afcce', 87171422, true, false, 'sol'),
        (559657766, '8PLm51NoiFWN4UTJCqLtDVQaY7REuyvtnye452F2g6nT', '0x62471f1420258e8645772a46368695cd15735383946535e61c4848ebfc1096dc', 87703018, true, false, 'sol'),
        (757029775, 'ENZgt2pBRsk5Wvh27edyakSAEWB7i2HTBPNt3qkrsiL1', '0x8c444ea5e953b1c5eb3f2279f6097954c5df6b8ddb773cfaf9d2fffdf96d3e5f', 88030862, true, false, 'sol'),
        (909832738, 'D3JPHbxPsc1NAJMpFUzbQv3F8mFUNhRE1XfpPMa9jhP6', '0x895a1531919f0623e9cd54da06f6d6b9672987c8970bd3776f705ff5704a8a19', 49427160, true, false, 'sol'),
        (371113, '0x75233886332605f450EDFAd71e447C9d074FC0Ac', '0xfede3d5d1dd62e998473c61ea0654c19dc3746acedb2df6713ab337fb0a091fe', 44782891, true, false, 'eth'),
        (433161296, '4Bssh8p7tM9e9aoYc7P2HFcHUqwojcTLiA1M3WipqeQ1', '0x17a3bd3569437722213da33bbc78c2a4b784349211eaecb104c7465fdef5e7e0', 78361603, true, false, 'sol'),
        (843947922, '4yyw3KdUh7a1cwFEvSqgvR5awoJNCms17i39fTHAHh4K', '0x6dba45a1577f37a2a97b17a3644923e808a21cc7af6025a9af9ccb9d58c912d6', 83493302, true, false, 'sol'),
        (1320407, 'FAyMCzfLgXgfTZFESxXK67zPFsTDackvFypZzXwZusgv', '0x525917e6c6b691ecd542d00637bd7e96b1d8fe52f802f040395958229a16ffa5', 73732182, true, false, 'sol'),
        (608463494, '8LxPdeghDsBcAk9hWU7x4WcCE6Hcbp3zVuPQQpB8AnSt', '0x91b666f9fc856c812ebce6759fa1442a0b634fa8d6f4a43a21be0697a239c173', 83209052, true, false, 'sol'),
        (1825231, 'C3sH6nSPxmXV33TD9ehhn4becd6wL295tyoBU4P6u8QB', '0xb52789b83262e58f2b8870c57dd9df384c19baf5e252404b0b8e22755e913b50', 40067100, true, false, 'sol'),
        (138692, '0x714a19B5bC28f35ce954e95F31E19443e34a1260', '0x65b195b536c960529e2bd1266d2c1c3b655340630dfe0618d013d21e898cd21a', 44247076, true, false, 'eth'),
        (391200, '0xa119b4F8E024787ad3C6420F081fB2e786A6dCE5', '0x58852ad0d85c396b13306835773b6af9705ae8412b7fdae8f28d390abca2fa18', 45970803, true, false, 'eth'),
        (309102, '0xFdeAA0aFd2B8FfeE1472A21aFe3f5a702B8B00b0', '0x72f29959d55f4b38fdb2215ee4ad0c4247a64776f1ab634567d50c4bc99b3023', 87014511, true, false, 'eth'),
        (309102, 'AZ26Rh5tLDysjq5NpbhUG964CAwPRgqfdNUecf3rtrkx', '0x72f29959d55f4b38fdb2215ee4ad0c4247a64776f1ab634567d50c4bc99b3023', 87014511, true, false, 'sol'),
        (348740, '0x0Bb6676595de1776f3Eb7b05AEa57a05572b4Cc9', '0xae28807d5998de438a77cc7f104807215b18b0347f72502cb8e49b141b0d9572', 87131825, true, false, 'eth'),
        (348740, '0x5dB1cAf29E1Ad4935b5088E4740dd3fb61C31895', '0xae28807d5998de438a77cc7f104807215b18b0347f72502cb8e49b141b0d9572', 87131825, true, false, 'eth'),
        (788911215, '2LWxdUgkDnWecGEtW7MsNoPcdtYucLgsUwH6n5ueykmH', '0x411e83e006424c7c22f8ce8fd852cc3cd8331f759f23cca200ed37b67343cf02', 82919061, true, false, 'sol'),
        (57441, '0xD01D744Ae46b1B80ed908479B8e704Ebd8a53ad7', '0x756f2a5f6c16a53ebe4d004def38401bdedf22ab2714c34151bd56476a3f6b0f', 87430915, true, false, 'eth'),
        (57441, '7Don2EcKtPyrrakLH9iAvjRqfAxegqT6CnTnmZHPh1MW', '0x756f2a5f6c16a53ebe4d004def38401bdedf22ab2714c34151bd56476a3f6b0f', 87430915, true, false, 'sol'),
        (877979983, '8kLwqF79YnTgznGCWYZ46AMjvt4aTVMCNq8NRDjz4LmS', '0x48a1a7f57d1e39edd043718efe20878e99a10b05da5852083b5f5083057b8f6e', 82858378, true, false, 'sol'),
        (819282160, 'FE7vsgXmrzUXnYo7wvA3pHtjE2RkQB1Vi5NBFmrPGprU', '0xe1331c6f4525fa31596c33063346ae421c62c98b7369bb3b9c8202a9ac3f3065', 82869245, true, false, 'sol'),
        (910045387, '3vsbKk55xPwnsqzH3JFi41oteSGcs3KQ6eNCcXCRpn3X', '0x0984d295a796d9755d203c143d7bc9236942a37aabccbc98b3e27d8b98c72b39', 82889634, true, false, 'sol'),
        (917592335, 'D6eLhsP3UGbNATgKrFfvfwUJxM9fYtuv2of7Pw8ajEQ2', '0xeab3c7cabd4d9de79344ac90918e2860730b5bf5ebe9718d72ca2704c036611f', 87696470, true, false, 'sol'),
        (1414776, '9DeDJZtN62BYRZNZ2nsEGDW2YhQVL4x3FDNprJms9e8g', '0xcdc39729de91bf6dd6324eef1ab819ebcc12e483cd5808593ed589ac74dc2043', 87694227, true, false, 'sol'),
        (193486862, '6b5n7STywEdr1S2obtktYnwgdUAPchX6PgteRTaU5e6Y', '0xf25b729f9d0e997895a6374a9144dc1a5d4ec3a6eff5fbbb170c9d21beecfc11', 87726438, true, false, 'sol'),
        (112882, '2NAxfEuHt8zc7NoJzXoTj9a9Jra4HdcYJeEm86yY1DxW', '0xa935bde8be85461b8f1340c012d899c409257faecae89eddaa2569c706e657ca', 68793994, true, false, 'sol')
    ON CONFLICT (user_id, wallet, chain) DO NOTHING;
END IF;
END $$;

COMMIT;