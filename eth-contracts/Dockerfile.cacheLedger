FROM trufflesuite/ganache-cli:v6.9.1

COPY . .

ENTRYPOINT ["node", "/app/ganache-core.docker.cli.js",  "-h",  "0.0.0.0", "-l", "8000000", "--deterministic","true", "--db", "./db", "--networkId", "1000000000000", "--acctKeys", "eth-contracts-ganache-accounts.json", "-a", "100"]