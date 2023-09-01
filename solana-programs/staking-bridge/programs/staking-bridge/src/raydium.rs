use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    program::invoke_signed,
    instruction::{
        AccountMeta,
        Instruction,
    },
};
use anchor_spl::token::spl_token;

use crate::constant::{
    RAYDIUM_AMM_PROGRAM_ADDRESS,
    SERUM_DEX_PROGRAM_ADDRESS,
    AUDIO_USDC_SERUM_MARKET_ADDRESS,
    AUDIO_USDC_RAYDIUM_AMM_ADDRESS
};
use crate::error::StakingBridgeErrorCode;
use crate::{
    Amounts,
    RaydiumSwap
};

/**
 * Verify that the programs used for the swap are correct.
 */
pub fn check_swap_programs(
    program_id: AccountInfo,
    serum_program: AccountInfo,
    amm: AccountInfo,
    serum_market: AccountInfo
) -> Result<()> {
    // 1. Verify that we are calling the Raydium AMM program.
    if program_id.key().to_string() != RAYDIUM_AMM_PROGRAM_ADDRESS.to_string() {
        return Err(StakingBridgeErrorCode::NotCallingRaydiumAmmProgram.into());
    }
    // 2. Verify that the correct Serum DEX program was passed in.
    if serum_program.key().to_string() != SERUM_DEX_PROGRAM_ADDRESS.to_string() {
        return Err(StakingBridgeErrorCode::InvalidSerumDexProgram.into());
    }
    // 3. Verify that the correct USDC-Audio amm was passed in.
    if amm.key().to_string() != AUDIO_USDC_RAYDIUM_AMM_ADDRESS.to_string() {
        return Err(StakingBridgeErrorCode::InvalidAmmProgram.into());
    }
    // 4. Verify that the correct Serum market was passed in.
    if serum_market.key().to_string() != AUDIO_USDC_SERUM_MARKET_ADDRESS.to_string() {
        return Err(StakingBridgeErrorCode::InvalidSerumMarketProgram.into());
    }

    Ok(())
}

/**
 * Verify that the correct PDAs are passed in.
 */
pub fn check_swap_pdas(
    accounts: &mut RaydiumSwap,
    vault_nonce: u64
) -> Result<()> {
    let program_id = &accounts.program_id;
    let amm = &accounts.amm;
    let amm_authority = &accounts.amm_authority;
    let amm_open_orders = &accounts.amm_open_orders;
    let amm_target_orders = &accounts.amm_target_orders;
    let serum_program = &accounts.serum_program;
    let serum_market = &accounts.serum_market;
    let serum_vault_signer = &accounts.serum_vault_signer;

    let (amm_pda, _amm_pda_bump) = Pubkey::find_program_address(
        &[program_id.key().as_ref(), serum_market.key().as_ref(), b"amm_associated_seed".as_ref()],
        program_id.key
    );
    if *amm.key != amm_pda {
        return Err(ErrorCode::ConstraintSeeds.into());
    }

    let (amm_authority_pda, _amm_authority_pda_bump) = Pubkey::find_program_address(
        &[&[97, 109, 109, 32, 97, 117, 116, 104, 111, 114, 105, 116, 121]],
        program_id.key
    );
    if *amm_authority.key != amm_authority_pda {
        return Err(ErrorCode::ConstraintSeeds.into());
    }

    let (amm_open_orders_pda, _amm_open_orders_pda_bump) = Pubkey::find_program_address(
        &[program_id.key().as_ref(), serum_market.key().as_ref(), b"open_order_associated_seed".as_ref()],
        program_id.key
    );
    if *amm_open_orders.key != amm_open_orders_pda {
        return Err(ErrorCode::ConstraintSeeds.into());
    }

    let (amm_target_orders_pda, _amm_target_orders_pda_bump) = Pubkey::find_program_address(
        &[program_id.key().as_ref(), serum_market.key().as_ref(), b"target_associated_seed".as_ref()],
        program_id.key
    );
    if *amm_target_orders.key != amm_target_orders_pda {
        return Err(ErrorCode::ConstraintSeeds.into());
    }

    let serum_vault_signer_pda = Pubkey::create_program_address(
        &[serum_market.key().as_ref(), vault_nonce.to_le_bytes().as_ref()],
        serum_program.key
    );
    let vault_signer = serum_vault_signer_pda.unwrap().key();
    if *serum_vault_signer.key != vault_signer.key() {
        return Err(ErrorCode::ConstraintSeeds.into());
    }

    Ok(())
}

/**
 * Build and invoke the instruction to swap USDC for AUDIO on Raydium.
 */
pub fn swap(
    accounts: &mut RaydiumSwap,
    amount_in: u64,
    minimum_amount_out: u64,
    staking_bridge_pda_bump: u8
) -> Result<()> {
    let program_id = &accounts.program_id.to_account_info();
    let amm = &accounts.amm.to_account_info();
    let amm_authority = &accounts.amm_authority.to_account_info();
    let amm_open_orders = &accounts.amm_open_orders.to_account_info();
    let amm_target_orders = &accounts.amm_target_orders.to_account_info();
    let pool_coin_token_account = &accounts.pool_coin_token_account.to_account_info();
    let pool_pc_token_account = &accounts.pool_pc_token_account.to_account_info();
    let serum_program = &accounts.serum_program.to_account_info();
    let serum_market = &accounts.serum_market.to_account_info();
    let serum_bids = &accounts.serum_bids.to_account_info();
    let serum_asks = &accounts.serum_asks.to_account_info();
    let serum_event_queue = &accounts.serum_event_queue.to_account_info();
    let serum_coin_vault_account = &accounts.serum_coin_vault_account.to_account_info();
    let serum_pc_vault_account = &accounts.serum_pc_vault_account.to_account_info();
    let serum_vault_signer = &accounts.serum_vault_signer.to_account_info();
    let user_source_token_account = &accounts.user_source_token_account.to_account_info();
    let user_destination_token_account = &accounts.user_destination_token_account.to_account_info();
    let user_source_owner = &accounts.user_source_owner.to_account_info();
    let spl_token_program = &accounts.spl_token_program;

    // https://github.com/raydium-io/raydium-contract-instructions/blob/master/lib/src/amm_instruction.rs#L162
    let instruction_index: u8 = 9;
    let data = Amounts {
        amount_in,
        minimum_amount_out,
    };
    let instruction = Instruction {
        program_id: program_id.key(),
        accounts: vec![
            // spl token
            AccountMeta::new_readonly(spl_token::id(), false),
            // amm
            AccountMeta::new(amm.key(), false),
            AccountMeta::new_readonly(amm_authority.key(), false),
            AccountMeta::new(amm_open_orders.key(), false),
            AccountMeta::new(amm_target_orders.key(), false),
            AccountMeta::new(pool_coin_token_account.key(), false),
            AccountMeta::new(pool_pc_token_account.key(), false),
            // serum
            AccountMeta::new_readonly(serum_program.key(), false),
            AccountMeta::new(serum_market.key(), false),
            AccountMeta::new(serum_bids.key(), false),
            AccountMeta::new(serum_asks.key(), false),
            AccountMeta::new(serum_event_queue.key(), false),
            AccountMeta::new(serum_coin_vault_account.key(), false),
            AccountMeta::new(serum_pc_vault_account.key(), false),
            AccountMeta::new_readonly(serum_vault_signer.key(), false),
            // our pda and its token accounts
            AccountMeta::new(user_source_token_account.key(), false),
            AccountMeta::new(user_destination_token_account.key(), false),
            AccountMeta::new_readonly(user_source_owner.key(), true),
        ],
        data: (instruction_index, data).try_to_vec()?,
    };
    let accounts = [
        // spl token
        spl_token_program.to_account_info().clone(),
        // amm
        amm.clone(),
        amm_authority.clone(),
        amm_open_orders.clone(),
        amm_target_orders.clone(),
        pool_coin_token_account.clone(),
        pool_pc_token_account.clone(),
        // serum
        serum_program.clone(),
        serum_market.clone(),
        serum_bids.clone(),
        serum_asks.clone(),
        serum_event_queue.clone(),
        serum_coin_vault_account.clone(),
        serum_pc_vault_account.clone(),
        serum_vault_signer.clone(),
        // our pda and its token accounts
        user_source_token_account.clone(),
        user_destination_token_account.clone(),
        user_source_owner.to_account_info().clone(),
    ];
    invoke_signed(
        &instruction,
        &accounts,
        &[&[b"staking_bridge".as_ref(), &[staking_bridge_pda_bump]]]
    )?;
    msg!("Successfully swapped {} tokens from {} for {} tokens from {}!", amount_in, user_source_token_account.key(), minimum_amount_out, user_destination_token_account.key());

    Ok(())
}
