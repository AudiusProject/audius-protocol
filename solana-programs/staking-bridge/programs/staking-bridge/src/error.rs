use anchor_lang::prelude::*;

#[error_code]
pub enum StakingBridgeErrorCode {
    #[msg("Source token account not owned by PDA.")]
    SourceTokenAccountNotOwnedByPDA,
    #[msg("Destination token account not owned by PDA.")]
    DestinationTokenAccountNotOwnedByPDA,
}
