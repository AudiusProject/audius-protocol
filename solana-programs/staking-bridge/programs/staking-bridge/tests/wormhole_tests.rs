#![cfg(feature = "test-bpf")]

use anchor_lang::prelude::Pubkey;

use staking_bridge::error::StakingBridgeErrorCode;
use staking_bridge::wormhole::{
    check_wormhole_programs,
    check_wormhole_token_accounts,
};
use staking_bridge::constant::{
  WORMHOLE_CORE_BRIDGE_ID,
  WORMHOLE_TOKEN_BRIDGE_ID
};

mod utils;
use utils::{
  get_initialized_token_account_info,
  make_readonly_account_info,
  assert_error
};

#[test]
fn test_wormhole_programs() {
    let token_bridge_key = &WORMHOLE_TOKEN_BRIDGE_ID.parse::<Pubkey>().unwrap();
    let core_bridge_key = &WORMHOLE_CORE_BRIDGE_ID.parse::<Pubkey>().unwrap();
    let other_key = &Pubkey::new_unique();

    let (token_bridge_lamports, token_bridge_data) = (&mut 0, &mut vec![]);
    let token_bridge_program = &make_readonly_account_info(
        token_bridge_key,
        token_bridge_lamports,
        token_bridge_data,
        other_key
    );
    let (core_bridge_lamports, core_bridge_data) = (&mut 0, &mut vec![]);
    let core_bridge_program = &make_readonly_account_info(
        core_bridge_key,
        core_bridge_lamports,
        core_bridge_data,
        other_key
    );
    let (bad_lamports, bad_data) = (&mut 0, &mut vec![]);
    let bad_account_info = &make_readonly_account_info(
        other_key,
        bad_lamports,
        bad_data,
        other_key
    );

    let bad_token_bridge_program_result = check_wormhole_programs(
      bad_account_info.clone(),
      core_bridge_program.clone(),
    );
    assert_error(bad_token_bridge_program_result, StakingBridgeErrorCode::NotCallingWormholeTokenBridgeProgram);

    let bad_core_bridge_program_result = check_wormhole_programs(
      token_bridge_program.clone(),
      bad_account_info.clone(),
    );
    assert_error(bad_core_bridge_program_result, StakingBridgeErrorCode::InvalidWormholeCoreBridgeProgram);

    let result = check_wormhole_programs(
      token_bridge_program.clone(),
      core_bridge_program.clone(),
    );
    assert_eq!(result, Ok(()));
}

#[test]
fn test_wormhole_token_accounts() {
    let from_key = Pubkey::new_unique();
    let from_owner_key = Pubkey::new_unique();
    let other_key = Pubkey::new_unique();

    let (from_lamports, from_data) = (&mut 0, &mut vec![]);
    let from_account_info = &get_initialized_token_account_info(
      &from_key,
      from_lamports,
      from_data,
      &other_key,
      &from_owner_key
    );

    let (from_owner_lamports, from_owner_data) = (&mut 0, &mut vec![]);
    let from_owner_account_info = &get_initialized_token_account_info(
      &from_owner_key,
      from_owner_lamports,
      from_owner_data,
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

    let bad_from_result = check_wormhole_token_accounts(
      bad_account_info.clone(),
      from_owner_account_info.clone(),
    );
    assert_error(bad_from_result, StakingBridgeErrorCode::WormholeTokenAccountNotOwnedByPDA);

    let bad_from_owner_result = check_wormhole_token_accounts(
      from_account_info.clone(),
      bad_account_info.clone(),
    );
    assert_error(bad_from_owner_result, StakingBridgeErrorCode::WormholeTokenAccountNotOwnedByPDA);

    let result = check_wormhole_token_accounts(
      from_account_info.clone(),
      from_owner_account_info.clone(),
    );
    assert_eq!(result, Ok(()));
}
