#![cfg(feature = "test-bpf")]

use anchor_lang::prelude::Pubkey;

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

mod utils;
use utils::{
  get_initialized_token_account_info,
  make_readonly_account_info,
  assert_error
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
