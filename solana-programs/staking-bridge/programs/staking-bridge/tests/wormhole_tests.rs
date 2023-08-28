#![cfg(feature = "test-sbf")]

use anchor_lang::prelude::Pubkey;

use staking_bridge::error::StakingBridgeErrorCode;
use staking_bridge::wormhole::check_wormhole_programs;
use staking_bridge::constant::{
  WORMHOLE_CORE_BRIDGE_ID,
  WORMHOLE_TOKEN_BRIDGE_ID
};

mod utils;
use utils::{
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
