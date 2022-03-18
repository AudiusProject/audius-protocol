solana-test-validator --reset

yarn run ts-node cli/main.ts -f initAdmin -k ~/.config/solana/id.json

yarn run ts-node cli/main.ts -f initUser -k ~/.config/solana/id.json --admin-keypair $PWD/adminKeypair.json --admin-storage-keypair $PWD/adminStorageKeypair.json -h handle2 -e 0x0a93d8cb0Be85B3Ea8f33FA63500D118deBc83F7

solana-keygen new -o userKeypair.json

yarn run ts-node cli/main.ts -f initUserSolPubkey -k ~/.config/solana/id.json --admin-storage-keypair $PWD/adminStorageKeypair.json --user-solana-keypair $PWD/userKeypair.json --user-storage-pubkey 63rWWYFVwP3B1wct1WY1QDJM6khQQRJnHCujqDEneP5S --eth-private-key d540ca11a0d12345f512e65e00bf8bf87435aa40b3731cbf0322971709eba60f

yarn run ts-node cli/main.ts -f createTrack -k ~/.config/solana/id.json  --admin-storage-keypair $PWD/adminStorageKeypair.json --user-solana-keypair $PWD/userKeypair.json --user-storage-pubkey 63rWWYFVwP3B1wct1WY1QDJM6khQQRJnHCujqDEneP5S -h handle2

yarn run ts-node cli/main.ts -f createPlaylist -k ~/.config/solana/id.json  --admin-storage-keypair $PWD/adminStorageKeypair.json --user-solana-keypair $PWD/userKeypair.json --user-storage-pubkey 63rWWYFVwP3B1wct1WY1QDJM6khQQRJnHCujqDEneP5S -h handle2
