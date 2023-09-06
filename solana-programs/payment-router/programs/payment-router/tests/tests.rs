#![cfg(feature = "test-sbf")]

use anchor_lang::prelude::{
  AccountInfo,
  Pubkey,
  Error,
};
use anchor_lang::solana_program::pubkey::PUBKEY_BYTES;
use anchor_spl::token::{
  TokenAccount,
  spl_token::state::ACCOUNT_INITIALIZED_INDEX
};

use payment_router::error::PaymentRouterErrorCode;
use payment_router::router::{
  check_sender,
  check_recipient_amounts,
};

#[test]
fn test_sender() {
    let sender_key = Pubkey::new_unique();
    let sender_owner_key = Pubkey::new_unique();
    let other_key = Pubkey::new_unique();

    let (sender_lamports, sender_data) = (&mut 0, &mut vec![]);
    let sender_account_info = &get_initialized_token_account_info(
      &sender_key,
      sender_lamports,
      sender_data,
      &other_key,
      &sender_owner_key
    );

    let (sender_owner_lamports, sender_owner_data) = (&mut 0, &mut vec![]);
    let sender_owner_account_info = &get_initialized_token_account_info(
      &sender_owner_key,
      sender_owner_lamports,
      sender_owner_data,
      &other_key,
      &other_key
    );

    let (bad_lamports, bad_data) = (&mut 0, &mut vec![]);
    let bad_account_info = &get_initialized_token_account_info(
      &other_key,
      bad_lamports,
      bad_data,
      &other_key,
      &other_key
    );

    let bad_sender_result = check_sender(
      bad_account_info.clone(),
      sender_owner_account_info.clone(),
    );
    assert_error(bad_sender_result, PaymentRouterErrorCode::SenderTokenAccountNotOwnedByPDA);

    let bad_sender_owner_result = check_sender(
      sender_account_info.clone(),
      bad_account_info.clone(),
    );
    assert_error(bad_sender_owner_result, PaymentRouterErrorCode::SenderTokenAccountNotOwnedByPDA);

    let result = check_sender(
      sender_account_info.clone(),
      sender_owner_account_info.clone(),
    );
    assert_eq!(result, Ok(()));
}

#[test]
fn test_recipient_amounts() {
    let key = Pubkey::new_unique();

    let (first_recipient_lamports, first_recipient_data) = (&mut 0, &mut vec![]);
    let first_recipient_account_info = &get_initialized_token_account_info(
        &key,
        first_recipient_lamports,
        first_recipient_data,
        &key,
        &key
    );
    let (second_recipient_lamports, second_recipient_data) = (&mut 0, &mut vec![]);
    let second_recipient_account_info = &get_initialized_token_account_info(
        &key,
        second_recipient_lamports,
        second_recipient_data,
        &key,
        &key
    );

    let remaining_accounts = vec![
        first_recipient_account_info.clone(),
        second_recipient_account_info.clone()
    ];
    let amounts = [1, 2];
    let total_amount = 3;

    let bad_accounts_result = check_recipient_amounts(
        &vec![first_recipient_account_info.clone()],
        amounts.to_vec(),
        total_amount
    );
    assert_error(bad_accounts_result, PaymentRouterErrorCode::RecipientAmountMismatch);

    let bad_amounts_result = check_recipient_amounts(
        &remaining_accounts,
        vec![1, 2, 3],
        total_amount
    );
    assert_error(bad_amounts_result, PaymentRouterErrorCode::RecipientAmountMismatch);

    let bad_total_result = check_recipient_amounts(
        &remaining_accounts,
        amounts.to_vec(),
        4
    );
    assert_error(bad_total_result, PaymentRouterErrorCode::TotalAmountMismatch);

    let result = check_recipient_amounts(
        &remaining_accounts,
        amounts.to_vec(),
        total_amount
    );
    assert_eq!(result, Ok(()));
}

fn get_initialized_token_account_info<'a>(
  key: &'a Pubkey,
  lamports: &'a mut u64,
  data: &'a mut Vec<u8>,
  mint: &'a Pubkey,
  owner: &'a Pubkey
) -> AccountInfo<'a> {
  // Set the mint and owner of the account.
  // Note that the mint offset is 0 and the owner offset is 32.
  data.extend_from_slice(&mint.to_bytes());
  data.extend_from_slice(&owner.to_bytes());
  let mint_and_owner_offset = 2 * PUBKEY_BYTES;
  let repeat_count = TokenAccount::LEN - mint_and_owner_offset;
  let mut repeated_bytes: Vec<u8> = vec![0; repeat_count];
  let initialize_offset = ACCOUNT_INITIALIZED_INDEX - mint_and_owner_offset;
  // Set the initialize byte to 1 which represents AccountState::Initialized
  // and the rest of the bytes to 0.
  repeated_bytes[initialize_offset] = 1;
  data.extend_from_slice(&repeated_bytes);
  make_readonly_account_info(
      key,
      lamports,
      data,
      owner
  )
}

fn make_readonly_account_info<'a>(
    key: &'a Pubkey,
    lamports: &'a mut u64,
    data: &'a mut [u8],
    owner: &'a Pubkey,
) -> AccountInfo<'a> {
    let is_signer = false;
    let is_writable = false;
    let executable = false;
    let rent_epoch = 0;
    AccountInfo::new(
        key,
        is_signer,
        is_writable,
        lamports,
        data,
        owner,
        executable,
        rent_epoch,
    )
}

fn assert_error(
    res: Result<(), Error>,
    error: PaymentRouterErrorCode,
) {
    if res != Err(error.into()) {
        panic!("Expected {:?}, but got {:?}", error, res.unwrap_err());
    }
}
