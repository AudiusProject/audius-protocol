sh -c "$(curl -sSfL https://release.solana.com/v1.10.4/install)"
cargo install --git https://github.com/project-serum/anchor --tag v0.18.2 anchor-cli --locked
cd anchor/audius-data
npm install
cd ../../