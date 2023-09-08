use anchor_lang::prelude::*;
use anchor_lang::{
    solana_program,
    solana_program::{
    program::invoke_signed,
    instruction::{
        AccountMeta,
        Instruction,
    },
}};
use anchor_spl::token::spl_token;

use crate::constant::{
    ETH_CHAIN_ID,
    ETH_RECIPIENT_ADDRESS_PADDED_32_BYTES,
    ETH_AUDIO_TOKEN_ADDRESS_PADDED_32_BYTES
};
use crate::{
    PostWormholeMessage,
    PostWormholeMessageData
};

pub fn check_wrapped_mint_pda(
  accounts: &mut PostWormholeMessage,
  wrapped_mint_bump: u8,
) -> Result<()> {
    let program_id = &accounts.program_id;
    let wrapped_mint = &accounts.wrapped_mint;

    let (wrapped_mint_pda, wrapped_mint_pda_bump) = Pubkey::find_program_address(
        &[b"wrapped".as_ref(), &ETH_CHAIN_ID.to_be_bytes()[..2], hex::decode(ETH_AUDIO_TOKEN_ADDRESS_PADDED_32_BYTES).unwrap().as_ref()],
        program_id.key
    );
    if *wrapped_mint.key != wrapped_mint_pda || wrapped_mint_bump != wrapped_mint_pda_bump {
        return Err(ErrorCode::ConstraintSeeds.into());
    }

    Ok(())
}

    // Build and invoke the approve instruction
pub fn approve_wormhole_transfer(
    accounts: &mut PostWormholeMessage,
    amount: u64,
    staking_bridge_pda_bump: u8
) -> Result<()> {
    let from = &accounts.from.to_account_info();
    let authority_signer = &accounts.authority_signer.to_account_info();
    let from_owner = &accounts.from_owner.to_account_info(); // PDA owned by this program which will sign the instruction

    // https://github.com/solana-labs/solana-program-library/blob/master/token/program/src/instruction.rs#L126
    let instruction_index: u8 = 4;
    let data = { amount };
    let instruction = Instruction {
        program_id: spl_token::id(),
        accounts: vec![
            AccountMeta::new(from.key(), false),
            AccountMeta::new_readonly(authority_signer.key(), false),
            AccountMeta::new_readonly(from_owner.key(), true),
        ],
        data: (instruction_index, data).try_to_vec()?,
    };
    let accounts = [
        from.clone(),
        authority_signer.clone(),
        from_owner.clone(),
    ];
    invoke_signed(
        &instruction,
        &accounts,
        &[&[b"staking_bridge".as_ref(), &[staking_bridge_pda_bump]]]
    )?;
    msg!("Approved the transfer of {} tokens.", amount);

    Ok(())
}

// Build and invoke the transfer instruction
pub fn execute_wormhole_transfer(
    accounts: &mut PostWormholeMessage,
    nonce: u32,
    amount: u64,
    staking_bridge_pda_bump: u8
) -> Result<()> {
    let program_id = &accounts.program_id.to_account_info();
    let bridge_id = &accounts.bridge_id.to_account_info();
    let payer = &accounts.payer;
    let config = &accounts.config.to_account_info();
    let from = &accounts.from.to_account_info();
    let from_owner = &accounts.from_owner.to_account_info(); // PDA owned by this program which will sign the instruction
    let wrapped_mint = &accounts.wrapped_mint.to_account_info();
    let wrapped_meta = &accounts.wrapped_meta.to_account_info();
    let authority_signer = &accounts.authority_signer.to_account_info();
    let bridge_config = &accounts.bridge_config.to_account_info();
    let message = &accounts.message;
    let emitter = &accounts.emitter.to_account_info();
    let sequence = &accounts.sequence.to_account_info();
    let fee_collector = &accounts.fee_collector.to_account_info();
    let clock = &accounts.clock;
    let rent = &accounts.rent;
    let spl_token = &accounts.spl_token;
    let system_program = &accounts.system_program;

    let mut target_address = [0u8; 32];
    target_address[..32].copy_from_slice(&hex::decode(ETH_RECIPIENT_ADDRESS_PADDED_32_BYTES).unwrap());
    let target_chain = ETH_CHAIN_ID;

    // https://github.com/wormhole-foundation/wormhole/blob/main/solana/modules/token_bridge/program/src/lib.rs#L107
    // This is the index of the TransferWrapped instruction in the Wormhole Token Bridge program
    let instruction_index: u8 = 4;
    let fee: u64 = 0;
    let data = PostWormholeMessageData {
        nonce,
        amount,
        fee,
        target_address,
        target_chain,
    };
    let instruction = Instruction {
        program_id: program_id.key(),
        accounts: vec![
            AccountMeta::new(payer.key(), true),
            AccountMeta::new_readonly(config.key(), false),
            AccountMeta::new(from.key(), false),
            AccountMeta::new_readonly(from_owner.key(), true),
            AccountMeta::new(wrapped_mint.key(), false),
            AccountMeta::new_readonly(wrapped_meta.key(), false),
            AccountMeta::new_readonly(authority_signer.key(), false),
            AccountMeta::new(bridge_config.key(), false),
            AccountMeta::new(message.key(), true),
            AccountMeta::new_readonly(emitter.key(), false),
            AccountMeta::new(sequence.key(), false),
            AccountMeta::new(fee_collector.key(), false),
            AccountMeta::new_readonly(solana_program::sysvar::clock::id(), false),
            AccountMeta::new_readonly(solana_program::sysvar::rent::id(), false),
            AccountMeta::new_readonly(solana_program::system_program::id(), false),
            AccountMeta::new_readonly(spl_token::id(), false),
            AccountMeta::new_readonly(bridge_id.key(), false),
        ],
        data: (instruction_index, data).try_to_vec()?,
    };
    let accounts = [
        payer.to_account_info().clone(),
        config.clone(),
        from.clone(),
        from_owner.clone(),
        wrapped_mint.clone(),
        wrapped_meta.clone(),
        authority_signer.clone(),
        bridge_config.clone(),
        message.to_account_info(),
        emitter.clone(),
        sequence.clone(),
        fee_collector.clone(),
        clock.to_account_info().clone(),
        rent.to_account_info().clone(),
        system_program.to_account_info().clone(),
        bridge_id.to_account_info().clone(),
        spl_token.to_account_info().clone(),
    ];
    invoke_signed(
        &instruction,
        &accounts,
        &[&[b"staking_bridge".as_ref(), &[staking_bridge_pda_bump]]]
    )?;
    msg!("Successfully transferred {} wrapped tokens.", amount);

    Ok(())
}
