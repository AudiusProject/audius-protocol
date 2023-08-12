use anchor_lang::prelude::*;

#[error_code]
pub enum StakingBridgeErrorCode {
    #[msg("Not calling raydium AMM program.")]
    NotCallingRaydiumAmmProgram,
    #[msg("Invalid serum DEX program.")]
    InvalidSerumDexProgram,
    #[msg("Invalid source token mint.")]
    InvalidSourceTokenMint,
    #[msg("Invalid destination token mint.")]
    InvalidDestinationTokenMint,
    #[msg("Source token account not owned by PDA.")]
    SourceTokenAccountNotOwnedByPDA,
    #[msg("Destination token account not owned by PDA.")]
    DestinationTokenAccountNotOwnedByPDA,
}
