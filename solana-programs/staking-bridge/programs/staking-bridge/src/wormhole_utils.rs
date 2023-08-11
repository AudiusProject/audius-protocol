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

use crate::{
    PostWormholeMessage,
    PostWormholeMessageData
};

pub fn check_wormhole_pdas(
  accounts: &mut PostWormholeMessage,
  config_bump: u8,
  wrapped_mint_bump: u8,
  wrapped_meta_bump: u8,
  authority_signer_bump: u8,
  bridge_config_bump: u8,
  emitter_bump: u8,
  sequence_bump: u8,
  fee_collector_bump: u8,
  token_address: [u8; 32],
  token_chain: u16
) -> Result<()> {
  let program_id = &accounts.program_id;
  let bridge_id = &accounts.bridge_id;
  let config = &accounts.config;
  let wrapped_mint = &accounts.wrapped_mint;
  let wrapped_meta = &accounts.wrapped_meta;
  let authority_signer = &accounts.authority_signer;
  let bridge_config = &accounts.bridge_config;
  let emitter = &accounts.emitter;
  let sequence = &accounts.sequence;
  let fee_collector = &accounts.fee_collector;

  let (config_pda, config_pda_bump) = Pubkey::find_program_address(
      &[b"config".as_ref()],
      program_id.key
  );
  if *config.key != config_pda || config_bump != config_pda_bump {
      return Err(ErrorCode::ConstraintSeeds.into());
  }

  let (wrapped_mint_pda, wrapped_mint_pda_bump) = Pubkey::find_program_address(
      &[b"wrapped".as_ref(), &token_chain.to_be_bytes()[..2], token_address.as_ref()],
      program_id.key
  );
  if *wrapped_mint.key != wrapped_mint_pda || wrapped_mint_bump != wrapped_mint_pda_bump {
      return Err(ErrorCode::ConstraintSeeds.into());
  }

  let (wrapped_meta_pda, wrapped_meta_pda_bump) = Pubkey::find_program_address(
      &[b"meta".as_ref(), &wrapped_mint.key().as_ref()],
      program_id.key
  );
  if *wrapped_meta.key != wrapped_meta_pda || wrapped_meta_bump != wrapped_meta_pda_bump {
      return Err(ErrorCode::ConstraintSeeds.into());
  }

  let (authority_signer_pda, authority_signer_pda_bump) = Pubkey::find_program_address(
      &[b"authority_signer".as_ref()],
      program_id.key
  );
  if *authority_signer.key != authority_signer_pda || authority_signer_bump != authority_signer_pda_bump {
      return Err(ErrorCode::ConstraintSeeds.into());
  }

  let (bridge_config_pda, bridge_config_pda_bump) = Pubkey::find_program_address(
      &[b"Bridge".as_ref()],
      bridge_id.key
  );
  if *bridge_config.key != bridge_config_pda || bridge_config_bump != bridge_config_pda_bump {
      return Err(ErrorCode::ConstraintSeeds.into());
  }

  let (emitter_pda, emitter_pda_bump) = Pubkey::find_program_address(
      &[b"emitter".as_ref()],
      program_id.key
  );
  if *emitter.key != emitter_pda || emitter_bump != emitter_pda_bump {
      return Err(ErrorCode::ConstraintSeeds.into());
  }

  let (sequence_pda, sequence_pda_bump) = Pubkey::find_program_address(
      &[b"Sequence".as_ref(), &emitter.key().as_ref()],
      bridge_id.key
  );
  if *sequence.key != sequence_pda || sequence_bump != sequence_pda_bump {
      return Err(ErrorCode::ConstraintSeeds.into());
  }

  let (fee_collector_pda, fee_collector_pda_bump) = Pubkey::find_program_address(
      &[b"fee_collector".as_ref()],
      bridge_id.key
  );
  if *fee_collector.key != fee_collector_pda || fee_collector_bump != fee_collector_pda_bump {
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
  let from = &accounts.from;
  let authority_signer = &accounts.authority_signer;
  let from_owner = &accounts.from_owner; // PDA owned by this program which will sign the instruction

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
      from_owner.to_account_info().clone(),
  ];
  invoke_signed(
      &instruction,
      &accounts,
      &[&[b"staking_bridge".as_ref(), &[staking_bridge_pda_bump]]]
  )?;
  msg!("Approved the transfer of {} tokens!", amount);

  Ok(())
}

// Build and invoke the transfer instruction
pub fn wormhole_transfer(
  accounts: &mut PostWormholeMessage,
  nonce: u32,
  amount: u64,
  fee: u64,
  target_address: [u8; 32],
  target_chain: u16,
  staking_bridge_pda_bump: u8
) -> Result<()> {
  let program_id = &accounts.program_id;
  let bridge_id = &accounts.bridge_id;
  let payer = &accounts.payer;
  let config = &accounts.config;
  let from = &accounts.from;
  let from_owner = &accounts.from_owner; // PDA owned by this program which will sign the instruction
  let wrapped_mint = &accounts.wrapped_mint;
  let wrapped_meta = &accounts.wrapped_meta;
  let authority_signer = &accounts.authority_signer;
  let bridge_config = &accounts.bridge_config;
  let message = &accounts.message;
  let emitter = &accounts.emitter;
  let sequence = &accounts.sequence;
  let fee_collector = &accounts.fee_collector;
  let clock = &accounts.clock;
  let rent = &accounts.rent;
  let spl_token = &accounts.spl_token;
  let system_program = &accounts.system_program;

  // https://github.com/wormhole-foundation/wormhole/blob/main/solana/modules/token_bridge/program/src/lib.rs#L107
  let instruction_index: u8 = 4;
  let data = PostWormholeMessageData {
      nonce,
      amount,
      fee,
      target_address,
      target_chain
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
      from_owner.to_account_info().clone(),
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
      bridge_id.to_account_info().clone(), // CHECK: Is this the correct order?
      spl_token.to_account_info().clone(),
  ];
  invoke_signed(
      &instruction,
      &accounts,
      &[&[b"staking_bridge".as_ref(), &[staking_bridge_pda_bump]]]
  )?;
  msg!("Successfully transferred {} wrapped tokens!", amount);

  Ok(())
}
