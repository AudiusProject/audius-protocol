use anchor_lang::prelude::*;

#[error_code]
pub enum StakingBridgeErrorCode {
    #[msg("Not calling Raydium AMM program.")]
    NotCallingRaydiumAmmProgram,
    #[msg("Invalid serum DEX program.")]
    InvalidSerumDexProgram,
    #[msg("Invalid USDC-$AUDIO AMM program")]
    InvalidAmmProgram,
    #[msg("Invalid serum market program.")]
    InvalidSerumMarketProgram,
    #[msg("Not calling Wormhole Token Bridge program.")]
    NotCallingWormholeTokenBridgeProgram,
    #[msg("Invalid Wormhole Core Bridge program.")]
    InvalidWormholeCoreBridgeProgram,
}
