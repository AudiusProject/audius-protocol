use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
  account_info::next_account_info,
  program::invoke_signed
};
use anchor_spl::token::spl_token;

use crate::error::PaymentRouterErrorCode;

// Verify PDA ownership of the sender token account.
pub fn check_sender(
  sender: AccountInfo,
  sender_owner: AccountInfo
) -> Result<()> {
    // Verify PDA ownership of the sender token account.
    // Note that anchor checks for the program ownership of the 'sender_owner' account,
    // i.e. that the owner of the sender account is owned by the program.
    // This is because we use the account macro with seeds and bump for the 'sender_owner'.
    let sender_data = sender.data.borrow();
    let sender_account_owner = <anchor_spl::token::spl_token::state::Account as anchor_spl::token::spl_token::state::GenericTokenAccount>
        ::unpack_account_owner(&sender_data)
        .unwrap();
    if sender_account_owner != sender_owner.key {
        return Err(PaymentRouterErrorCode::SenderTokenAccountNotOwnedByPDA.into());
    }

    Ok(())
}

/**
 * 1. Verify that the number of recipients matches the number of amounts.
 * 2. Verify that the total of individual amounts matches the total amount.
 */
pub fn check_recipient_amounts(
  remaining_accounts: &[AccountInfo],
  amounts: Vec<u64>,
  total_amount: u64
) -> Result<()> {
    // 1. Verify that the number of recipients matches the number of amounts.
    if remaining_accounts.len() != amounts.len() {
        return Err(PaymentRouterErrorCode::RecipientAmountMismatch.into());
    }
    // 2. Verify that the total of individual amounts matches the total amount.
    let total: u64 = amounts.iter().sum();
    if total != total_amount {
        return Err(PaymentRouterErrorCode::TotalAmountMismatch.into());
    }

    Ok(())
}

/**
 * Iterate through the recipient accounts, represented by the remaining accounts
 * and transfer the respective amount to each recipient,
 * while checking that the recipient account token mint matches the given token mint.
 */
pub fn execute_transfers<'info>(
    sender: AccountInfo<'info>,
    sender_owner: AccountInfo<'info>,
    remaining_accounts: &[AccountInfo<'info>],
    amounts: Vec<u64>,
    payment_router_pda_bump: u8,
) -> Result<()> {
    let remaining_accounts_iter = &mut remaining_accounts.iter();
    let mut amount_index = 0;
    while let Ok(receiver) = next_account_info(remaining_accounts_iter) {
        let receiver = receiver.to_account_info();
        let amount = *amounts.get(amount_index).unwrap();
        let account_infos = &[sender.clone(), receiver.clone(), sender_owner.clone()];
        let transfer = &spl_token::instruction::transfer(
            &spl_token::id(),
            sender.key,
            receiver.key,
            sender_owner.key,
            &[sender_owner.key],
            amount,
        )?;

        // Execute transfer of amount to recipient.
        invoke_signed(
            transfer,
            account_infos,
            &[&[b"payment_router".as_ref(), &[payment_router_pda_bump]]],
        )?;

        amount_index += 1;
    }
    msg!("All transfers complete!");

    Ok(())
}
