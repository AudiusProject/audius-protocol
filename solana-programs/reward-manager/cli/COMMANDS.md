# Commands
### Init market
```
spl-token create-token t1_keypair.json && \
cargo run init --keypair locnet_keypair.json --token-mint CV3A2AbeKc4CoRRcyWwe96LkPktpaPnUAgnzqJVy6wKf --min-votes 3
```
### Create senders
```
cargo run create-sender --reward-manager 4P2WtU2RayKhRc1pfjJP5M9JmVVWZQi91za2ugJvHumG --eth-sender-address 0xd63cF911A8F8991cA8eFa9De7cCA3d1d370ec60C --eth-operator-address 0xf3a628104B0124b82E3c956Efd6271595E1407e0  && \
cargo run create-sender --reward-manager 4P2WtU2RayKhRc1pfjJP5M9JmVVWZQi91za2ugJvHumG --eth-sender-address 0xdD4B7F49d6392b53b5f1a43Ba4FbFd4617E5016E --eth-operator-address 0xF0BA54Ca13cD89e62Ec2a6B908388A7Ab6C44Ab9  && \
cargo run create-sender --reward-manager 4P2WtU2RayKhRc1pfjJP5M9JmVVWZQi91za2ugJvHumG --eth-sender-address 0x5AB13DCAF366D582FA72322A485BCbc410a8C1e7 --eth-operator-address 0x808a8d9B6D9b28FF0b9b2cfe3fEC47655bEd4463  && \
cargo run create-sender --reward-manager 4P2WtU2RayKhRc1pfjJP5M9JmVVWZQi91za2ugJvHumG --eth-sender-address 0x3cc097d8552B555d93aD9a0f07c1D9922dfa2d70 --eth-operator-address 0x2892e8b9adCd2538e31bF692dB98facfC112178c
```
### Creating bot message
```
cargo run verify-transfer-signature --reward-manager 4P2WtU2RayKhRc1pfjJP5M9JmVVWZQi91za2ugJvHumG --keypair locnet_verify_keypair.json --address 464fNyy1Pc7ovcsmGJynLWU4dxyT7GfyXXhuvrRJSbUB --secret f11081e12549e5f7faddfee0313fb44077fb4a9723a912bbb9fd8a04591d45f0 --transfer-id abc123 --recipient 0xaDf719618118224508c1fC1ef36ca45234B354E6 --amount 0.5
```
### Creating sender messages
```
cargo run verify-transfer-signature --reward-manager 4P2WtU2RayKhRc1pfjJP5M9JmVVWZQi91za2ugJvHumG --pubkey CH3iDZ9jB7T7bXUR2d6u969JV9p9s7BVcAV3baKVaCM8 --address HhiAcsMvXbrxgSMDRQqKFtNgqT3LVEFNgsrQchwJz7tS --secret 9b4f73069739bc1d3f8e5ac54ff814dbad791c04a00762d559bf508d7cb8903b --transfer-id abc123 --recipient 0xaDf719618118224508c1fC1ef36ca45234B354E6 --amount 0.5 --bot-oracle 464fNyy1Pc7ovcsmGJynLWU4dxyT7GfyXXhuvrRJSbUB  && \
cargo run verify-transfer-signature --reward-manager 4P2WtU2RayKhRc1pfjJP5M9JmVVWZQi91za2ugJvHumG --pubkey CH3iDZ9jB7T7bXUR2d6u969JV9p9s7BVcAV3baKVaCM8 --address CpWrZv62RFkAH5s9EvWYiNhVnhYxBZHrCQ6TM29hA5NM --secret df41e24a223c51dcaaa28199473fff3c7eabf6e7150b9e242c078f5772a36bf8 --transfer-id abc123 --recipient 0xaDf719618118224508c1fC1ef36ca45234B354E6 --amount 0.5 --bot-oracle 464fNyy1Pc7ovcsmGJynLWU4dxyT7GfyXXhuvrRJSbUB  && \
cargo run verify-transfer-signature --reward-manager 4P2WtU2RayKhRc1pfjJP5M9JmVVWZQi91za2ugJvHumG --pubkey CH3iDZ9jB7T7bXUR2d6u969JV9p9s7BVcAV3baKVaCM8 --address FmDEPVLbmCPMLzhkwivsg2r3aGeWJWjaaBht3Ymd8Hhd --secret 5a8cb969f93f541bbe3ed34dfcc4a74cb13a9a07ad4b23be29d266edae12afa0 --transfer-id abc123 --recipient 0xaDf719618118224508c1fC1ef36ca45234B354E6 --amount 0.5 --bot-oracle 464fNyy1Pc7ovcsmGJynLWU4dxyT7GfyXXhuvrRJSbUB
```
### Mint
```
spl-token mint CV3A2AbeKc4CoRRcyWwe96LkPktpaPnUAgnzqJVy6wKf 100000000 7EtBB4PYBvvRvRDXXXfEEYrJNkU47m1o8B7XNw6Sw5dP
```
### Complete transfer
```
cargo run transfer --reward-manager 4P2WtU2RayKhRc1pfjJP5M9JmVVWZQi91za2ugJvHumG --verified-messages CH3iDZ9jB7T7bXUR2d6u969JV9p9s7BVcAV3baKVaCM8 --transfer-id abc123 --recipient 0xaDf719618118224508c1fC1ef36ca45234B354E6 --amount 0.5 --bot-oracle 464fNyy1Pc7ovcsmGJynLWU4dxyT7GfyXXhuvrRJSbUB
```