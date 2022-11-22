install solana dev deps on host

```
# https://rustup.rs/
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# https://docs.solana.com/getstarted/local
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# https://www.anchor-lang.com/docs/installation
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.25.0

# yarn
npm install -g yarn

# update grep
brew install grep
```

host.docker.internal


$ cat /private/var/orion/.config/solana/cli/config.yml
---
json_rpc_url: "http://127.0.0.1:8899"
websocket_url: ""
keypair_path: /private/var/orion/.config/solana/id.json
address_labels:
  "11111111111111111111111111111111": System Program
commitment: confirmed


root@f98a9877467a:/usr/src/app# cat /root/.config/solana/cli/config.yml
---
json_rpc_url: "http://host.docker.internal:8899"
websocket_url: ""
keypair_path: /root/.config/solana/id.json
address_labels:
  "11111111111111111111111111111111": System Program
commitment: confirmed



mkfifo pipe1
ls -al pipe1
tail -f pipe1
echo "foo" >> pipe1


SOLANA_HOST="http://127.0.0.1:8899" ./scripts/deploy.sh

cargo install spl-token-cli
