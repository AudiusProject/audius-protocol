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
use staking_bridge::raydium::{
    check_swap_programs,
    check_swap_token_accounts,
};
use staking_bridge::constant::{
    RAYDIUM_AMM_PROGRAM_ADDRESS,
    SERUM_DEX_PROGRAM_ADDRESS,
    SOL_USDC_TOKEN_ADDRESS,
    SOL_AUDIO_TOKEN_ADDRESS,
};

#[test]
fn test_swap_programs() {
    let raydium_key = &RAYDIUM_AMM_PROGRAM_ADDRESS.parse::<Pubkey>().unwrap();
    let serum_key = &SERUM_DEX_PROGRAM_ADDRESS.parse::<Pubkey>().unwrap();
    let other_key = &Pubkey::new_unique();

    let (raydium_lamports, raydium_data) = (&mut 0, &mut vec![]);
    let (serum_lamports, serum_data) = (&mut 0, &mut vec![]);
    let (bad_lamports, bad_data) = (&mut 0, &mut vec![]);
    let raydium_program = &make_readonly_account_info(
        raydium_key,
        raydium_lamports,
        raydium_data,
        other_key
    );
    let serum_program = &make_readonly_account_info(
        serum_key,
        serum_lamports,
        serum_data,
        other_key
    );
    let bad_account_info = &make_readonly_account_info(
        other_key,
        bad_lamports,
        bad_data,
        other_key
    );

    let bad_raydium_program_result = check_swap_programs(
      bad_account_info.clone(),
      serum_program.clone(),
    );
    assert_error(bad_raydium_program_result, StakingBridgeErrorCode::NotCallingRaydiumAmmProgram);

    let bad_serum_program_result = check_swap_programs(
      raydium_program.clone(),
      bad_account_info.clone(),
    );
    assert_error(bad_serum_program_result, StakingBridgeErrorCode::InvalidSerumDexProgram);

    let result = check_swap_programs(
      raydium_program.clone(),
      serum_program.clone(),
    );
    assert_eq!(result, Ok(()));
}

#[test]
fn test_swap_token_accounts() {
    let usdc_mint_key = SOL_USDC_TOKEN_ADDRESS.parse::<Pubkey>().unwrap();
    let audio_mint_key = SOL_AUDIO_TOKEN_ADDRESS.parse::<Pubkey>().unwrap();

    let source_key = Pubkey::new_unique();
    let destination_key = Pubkey::new_unique();
    let owner_key = Pubkey::new_unique();
    let other_key = Pubkey::new_unique();

    let (source_lamports, source_data) = (&mut 0, &mut vec![]);
    let source_account_info = &get_initialized_token_account_info(
      &source_key,
      source_lamports,
      source_data,
      &usdc_mint_key,
      &owner_key
    );

    let (destination_lamports, destination_data) = (&mut 0, &mut vec![]);
    let destination_account_info = &get_initialized_token_account_info(
      &destination_key,
      destination_lamports,
      destination_data,
      &audio_mint_key,
      &owner_key
    );

    let (owner_lamports, owner_data) = (&mut 0, &mut vec![]);
    let owner_account_info = &get_initialized_token_account_info(
      &owner_key,
      owner_lamports,
      owner_data,
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

    let (bad_mint_lamports, bad_mint_data) = (&mut 0, &mut vec![]);
    let bad_mint_account_info = &get_initialized_token_account_info(
      &other_key,
      bad_mint_lamports,
      bad_mint_data,
      &other_key,
      &owner_key
    );

    let bad_source_result = check_swap_token_accounts(
      bad_account_info.clone(),
      destination_account_info.clone(),
      owner_account_info.clone(),
    );
    assert_error(bad_source_result, StakingBridgeErrorCode::SourceTokenAccountNotOwnedByPDA);

    let bad_destination_result = check_swap_token_accounts(
      source_account_info.clone(),
      bad_account_info.clone(),
      owner_account_info.clone(),
    );
    assert_error(bad_destination_result, StakingBridgeErrorCode::DestinationTokenAccountNotOwnedByPDA);

    let bad_owner_result = check_swap_token_accounts(
      source_account_info.clone(),
      destination_account_info.clone(),
      bad_account_info.clone(),
    );
    assert_error(bad_owner_result, StakingBridgeErrorCode::SourceTokenAccountNotOwnedByPDA);

    let bad_source_mint_result = check_swap_token_accounts(
      bad_mint_account_info.clone(),
      destination_account_info.clone(),
      owner_account_info.clone(),
    );
    assert_error(bad_source_mint_result, StakingBridgeErrorCode::InvalidSourceTokenMint);

    let bad_destination_mint_result = check_swap_token_accounts(
      source_account_info.clone(),
      bad_mint_account_info.clone(),
      owner_account_info.clone(),
    );
    assert_error(bad_destination_mint_result, StakingBridgeErrorCode::InvalidDestinationTokenMint);

    let result = check_swap_token_accounts(
      source_account_info.clone(),
      destination_account_info.clone(),
      owner_account_info.clone(),
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
    error: StakingBridgeErrorCode,
) {
  if res != Err(error.into()) {
      panic!("Expected {:?}, but got {:?}", error, res.unwrap_err());
  }
}
