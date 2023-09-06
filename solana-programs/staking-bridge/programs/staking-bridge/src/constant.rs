use solana_program::{pubkey, pubkey::Pubkey};

// Audius ETH Governance Address
pub const ETH_RECIPIENT_ADDRESS_PADDED_32_BYTES: &str = "0000000000000000000000004DEcA517D6817B6510798b7328F2314d3003AbAC";

// https://docs.raydium.io/raydium/protocol/developers/addresses
pub const RAYDIUM_AMM_PROGRAM: Pubkey = pubkey!("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");

// https://github.com/project-serum/serum-dex/blob/master/README.md#program-deployments
pub const SERUM_DEX_PROGRAM: Pubkey = pubkey!("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin");

// https://solscan.io/token/9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM
pub const SOL_AUDIO_TOKEN: Pubkey = pubkey!("9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM");

// https://etherscan.io/token/0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998
pub const ETH_AUDIO_TOKEN_ADDRESS_PADDED_32_BYTES: &str = "00000000000000000000000018aAA7115705e8be94bfFEBDE57Af9BFc265B998";

// https://solscan.io/account/FxquLRmVMPXiS84FFSp8q5fbVExhLkX85yiXucyu7xSC
pub const AUDIO_USDC_SERUM_MARKET: Pubkey = pubkey!("FxquLRmVMPXiS84FFSp8q5fbVExhLkX85yiXucyu7xSC");

// https://solscan.io/account/4EbdAfaShVDNeHm6GbXZX3xsKccRHdTbR5962Bvya8xt
pub const AUDIO_USDC_RAYDIUM_AMM: Pubkey = pubkey!("4EbdAfaShVDNeHm6GbXZX3xsKccRHdTbR5962Bvya8xt");

// https://book.wormhole.com/reference/contracts.html
pub const WORMHOLE_CORE_BRIDGE_ID: Pubkey = pubkey!("worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth");
pub const WORMHOLE_TOKEN_BRIDGE_ID: Pubkey = pubkey!("wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb");
pub const ETH_CHAIN_ID: u16 = 2;
