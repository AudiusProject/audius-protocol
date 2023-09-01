#![cfg(feature = "test-sbf")]

use anchor_lang::prelude::Pubkey;

use staking_bridge::error::StakingBridgeErrorCode;
use staking_bridge::raydium::check_swap_programs;
use staking_bridge::constant::{
    RAYDIUM_AMM_PROGRAM_ADDRESS,
    SERUM_DEX_PROGRAM_ADDRESS,
    AUDIO_USDC_RAYDIUM_AMM_ADDRESS,
    AUDIO_USDC_SERUM_MARKET_ADDRESS
};

mod utils;
use utils::{
  make_readonly_account_info,
  assert_error
};

#[test]
fn test_swap_programs() {
    let raydium_key = &RAYDIUM_AMM_PROGRAM_ADDRESS.parse::<Pubkey>().unwrap();
    let serum_key = &SERUM_DEX_PROGRAM_ADDRESS.parse::<Pubkey>().unwrap();
    let amm_key = &AUDIO_USDC_RAYDIUM_AMM_ADDRESS.parse::<Pubkey>().unwrap();
    let market_key = &AUDIO_USDC_SERUM_MARKET_ADDRESS.parse::<Pubkey>().unwrap();
    let other_key = &Pubkey::new_unique();

    let (raydium_lamports, raydium_data) = (&mut 0, &mut vec![]);
    let (serum_lamports, serum_data) = (&mut 0, &mut vec![]);
    let (amm_lamports, amm_data) = (&mut 0, &mut vec![]);
    let (market_lamports, market_data) = (&mut 0, &mut vec![]);
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
    let amm_program = &make_readonly_account_info(
        amm_key,
        amm_lamports,
        amm_data,
        other_key
    );
    let market_program = &make_readonly_account_info(
        market_key,
        market_lamports,
        market_data,
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
      amm_program.clone(),
      market_program.clone(),
    );
    assert_error(bad_raydium_program_result, StakingBridgeErrorCode::NotCallingRaydiumAmmProgram);

    let bad_serum_program_result = check_swap_programs(
      raydium_program.clone(),
      bad_account_info.clone(),
      amm_program.clone(),
      market_program.clone(),
    );
    assert_error(bad_serum_program_result, StakingBridgeErrorCode::InvalidSerumDexProgram);

    let bad_amm_program_result = check_swap_programs(
      raydium_program.clone(),
      serum_program.clone(),
      bad_account_info.clone(),
      market_program.clone(),
    );
    assert_error(bad_amm_program_result, StakingBridgeErrorCode::InvalidAmmProgram);

    let bad_market_program_result = check_swap_programs(
      raydium_program.clone(),
      serum_program.clone(),
      amm_program.clone(),
      bad_account_info.clone(),
    );
    assert_error(bad_market_program_result, StakingBridgeErrorCode::InvalidSerumMarketProgram);

    let result = check_swap_programs(
      raydium_program.clone(),
      serum_program.clone(),
      amm_program.clone(),
      market_program.clone(),
    );
    assert_eq!(result, Ok(()));
}
