use anchor_lang::prelude::*;

#[error_code]
pub enum PaymentRouterErrorCode {
    #[msg("Sender token account not owned by PDA.")]
    SenderTokenAccountNotOwnedByPDA,
    #[msg("Number of recipients does not match number of amounts.")]
    RecipientAmountMismatch,
    #[msg("Total of individual amounts does not match total amount.")]
    TotalAmountMismatch,
}
