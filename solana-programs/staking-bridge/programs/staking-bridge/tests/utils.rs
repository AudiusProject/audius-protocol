#![cfg(feature = "test-bpf")]

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

use staking_bridge::error::StakingBridgeErrorCode;

pub fn get_initialized_token_account_info<'a>(
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

pub fn make_readonly_account_info<'a>(
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

pub fn assert_error(
    res: Result<(), Error>,
    error: StakingBridgeErrorCode,
) {
    if res != Err(error.into()) {
        panic!("Expected {:?}, but got {:?}", error, res.unwrap_err());
    }
}
