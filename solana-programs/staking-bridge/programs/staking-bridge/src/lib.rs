use anchor_lang::prelude::*;
use anchor_spl::token::{
    spl_token,
    Token
};

pub mod utils;

use utils::{Alec, yolo};

declare_id!("HEDM7Zg7wNVSCWpV4TF7zp6rgj44C43CXnLtpY68V7bV");

// fn swap(
//     accounts: &mut RaydiumSwap,
//     amount_in: u64,
//     minimum_amount_out: u64,
//     staking_bridge_pda_bump: u8
// ) -> Result<()> {
//     let program_id = &accounts.program_id;
//     let amm = &accounts.amm;
//     let amm_authority = &accounts.amm_authority;
//     let amm_open_orders = &accounts.amm_open_orders;
//     let amm_target_orders = &accounts.amm_target_orders;
//     let pool_coin_token_account = &accounts.pool_coin_token_account;
//     let pool_pc_token_account = &accounts.pool_pc_token_account;
//     let serum_program = &accounts.serum_program;
//     let serum_market = &accounts.serum_market;
//     let serum_bids = &accounts.serum_bids;
//     let serum_asks = &accounts.serum_asks;
//     let serum_event_queue = &accounts.serum_event_queue;
//     let serum_coin_vault_account = &accounts.serum_coin_vault_account;
//     let serum_pc_vault_account = &accounts.serum_pc_vault_account;
//     let serum_vault_signer = &accounts.serum_vault_signer;
//     let user_source_token_account = &accounts.user_source_token_account;
//     let user_destination_token_account = &accounts.user_destination_token_account;
//     let user_source_owner = &accounts.user_source_owner;
//     let spl_token_program = &accounts.spl_token_program;

//     // https://github.com/raydium-io/raydium-contract-instructions/blob/master/lib/src/amm_instruction.rs#L162
//     let instruction_index: u8 = 9;
//     let data = Amounts {
//         amount_in,
//         minimum_amount_out,
//     };
//     let instruction = Instruction {
//         program_id: program_id.key(),
//         accounts: vec![
//             // spl token
//             AccountMeta::new_readonly(spl_token::id(), false),
//             // amm
//             AccountMeta::new(amm.key(), false),
//             AccountMeta::new_readonly(amm_authority.key(), false),
//             AccountMeta::new(amm_open_orders.key(), false),
//             AccountMeta::new(amm_target_orders.key(), false),
//             AccountMeta::new(pool_coin_token_account.key(), false),
//             AccountMeta::new(pool_pc_token_account.key(), false),
//             // serum
//             AccountMeta::new_readonly(serum_program.key(), false),
//             AccountMeta::new(serum_market.key(), false),
//             AccountMeta::new(serum_bids.key(), false),
//             AccountMeta::new(serum_asks.key(), false),
//             AccountMeta::new(serum_event_queue.key(), false),
//             AccountMeta::new(serum_coin_vault_account.key(), false),
//             AccountMeta::new(serum_pc_vault_account.key(), false),
//             AccountMeta::new_readonly(serum_vault_signer.key(), false),
//             // user
//             AccountMeta::new(user_source_token_account.key(), false),
//             AccountMeta::new(user_destination_token_account.key(), false),
//             AccountMeta::new_readonly(user_source_owner.key(), true),
//         ],
//         data: (instruction_index, data).try_to_vec()?,
//     };
//     let accounts = [
//         // spl token
//         spl_token_program.to_account_info().clone(),
//         // amm
//         amm.clone(),
//         amm_authority.clone(),
//         amm_open_orders.clone(),
//         amm_target_orders.clone(),
//         pool_coin_token_account.clone(),
//         pool_pc_token_account.clone(),
//         // serum
//         serum_program.clone(),
//         serum_market.clone(),
//         serum_bids.clone(),
//         serum_asks.clone(),
//         serum_event_queue.clone(),
//         serum_coin_vault_account.clone(),
//         serum_pc_vault_account.clone(),
//         serum_vault_signer.clone(),
//         // user
//         user_source_token_account.clone(),
//         user_destination_token_account.clone(),
//         user_source_owner.to_account_info().clone(),
//     ];
//     invoke_signed(
//         &instruction,
//         &accounts,
//         &[&[b"staking_bridge".as_ref(), &[staking_bridge_pda_bump]]]
//     )?;
//     msg!("Successfully swapped {} tokens from {} for {} tokens from {}!", amount_in, user_source_token_account.key(), minimum_amount_out, user_destination_token_account.key());

//     Ok(())
// }

// fn check_raydium_pdas(
//     accounts: &mut RaydiumSwap,
//     vault_nonce: u64
// ) -> Result<()> {
//     let program_id = &accounts.program_id;
//     let amm = &accounts.amm;
//     let amm_authority = &accounts.amm_authority;
//     let amm_open_orders = &accounts.amm_open_orders;
//     let amm_target_orders = &accounts.amm_target_orders;
//     let serum_program = &accounts.serum_program;
//     let serum_market = &accounts.serum_market;
//     let serum_vault_signer = &accounts.serum_vault_signer;

//     let (amm_pda, _amm_pda_bump) = Pubkey::find_program_address(
//         &[program_id.key().as_ref(), serum_market.key().as_ref(), b"amm_associated_seed".as_ref()],
//         program_id.key
//     );
//     if *amm.key != amm_pda {
//         return Err(ErrorCode::ConstraintSeeds.into());
//     }

//     let (amm_authority_pda, _amm_authority_pda_bump) = Pubkey::find_program_address(
//         &[&[97, 109, 109, 32, 97, 117, 116, 104, 111, 114, 105, 116, 121]],
//         program_id.key
//     );
//     if *amm_authority.key != amm_authority_pda {
//         return Err(ErrorCode::ConstraintSeeds.into());
//     }

//     let (amm_open_orders_pda, _amm_open_orders_pda_bump) = Pubkey::find_program_address(
//         &[program_id.key().as_ref(), serum_market.key().as_ref(), b"open_order_associated_seed".as_ref()],
//         program_id.key
//     );
//     if *amm_open_orders.key != amm_open_orders_pda {
//         return Err(ErrorCode::ConstraintSeeds.into());
//     }

//     let (amm_target_orders_pda, _amm_target_orders_pda_bump) = Pubkey::find_program_address(
//         &[program_id.key().as_ref(), serum_market.key().as_ref(), b"target_associated_seed".as_ref()],
//         program_id.key
//     );
//     if *amm_target_orders.key != amm_target_orders_pda {
//         return Err(ErrorCode::ConstraintSeeds.into());
//     }

//     let serum_vault_signer_pda = Pubkey::create_program_address(
//         &[serum_market.key().as_ref(), vault_nonce.to_le_bytes().as_ref()],
//         serum_program.key
//     );
//     let vault_signer = serum_vault_signer_pda.unwrap().key();
//     if *serum_vault_signer.key != vault_signer.key() {
//         return Err(ErrorCode::ConstraintSeeds.into());
//     }

//     Ok(())
// }

// fn check_wormhole_pdas(
//     accounts: &mut PostWormholeMessage,
//     config_bump: u8,
//     wrapped_mint_bump: u8,
//     wrapped_meta_bump: u8,
//     authority_signer_bump: u8,
//     bridge_config_bump: u8,
//     emitter_bump: u8,
//     sequence_bump: u8,
//     fee_collector_bump: u8
// ) -> Result<()> {
//     let program_id = &accounts.program_id;
//     let bridge_id = &accounts.bridge_id;
//     let config = &accounts.config;
//     let wrapped_mint = &accounts.wrapped_mint;
//     let wrapped_meta = &accounts.wrapped_meta;
//     let authority_signer = &accounts.authority_signer;
//     let bridge_config = &accounts.bridge_config;
//     let emitter = &accounts.emitter;
//     let sequence = &accounts.sequence;
//     let fee_collector = &accounts.fee_collector;

//     let (config_pda, config_pda_bump) = Pubkey::find_program_address(
//         &[b"config".as_ref()],
//         program_id.key
//     );
//     if *config.key != config_pda || config_bump != config_pda_bump {
//         return Err(ErrorCode::ConstraintSeeds.into());
//     }

//     let (wrapped_mint_pda, wrapped_mint_pda_bump) = Pubkey::find_program_address(
//         &[b"wrapped".as_ref(), &token_chain.to_be_bytes()[..2], token_address.as_ref()],
//         program_id.key
//     );
//     if *wrapped_mint.key != wrapped_mint_pda || wrapped_mint_bump != wrapped_mint_pda_bump {
//         return Err(ErrorCode::ConstraintSeeds.into());
//     }

//     let (wrapped_meta_pda, wrapped_meta_pda_bump) = Pubkey::find_program_address(
//         &[b"meta".as_ref(), &wrapped_mint.key().as_ref()],
//         program_id.key
//     );
//     if *wrapped_meta.key != wrapped_meta_pda || wrapped_meta_bump != wrapped_meta_pda_bump {
//         return Err(ErrorCode::ConstraintSeeds.into());
//     }

//     let (authority_signer_pda, authority_signer_pda_bump) = Pubkey::find_program_address(
//         &[b"authority_signer".as_ref()],
//         program_id.key
//     );
//     if *authority_signer.key != authority_signer_pda || authority_signer_bump != authority_signer_pda_bump {
//         return Err(ErrorCode::ConstraintSeeds.into());
//     }

//     let (bridge_config_pda, bridge_config_pda_bump) = Pubkey::find_program_address(
//         &[b"Bridge".as_ref()],
//         bridge_id.key
//     );
//     if *bridge_config.key != bridge_config_pda || bridge_config_bump != bridge_config_pda_bump {
//         return Err(ErrorCode::ConstraintSeeds.into());
//     }

//     let (emitter_pda, emitter_pda_bump) = Pubkey::find_program_address(
//         &[b"emitter".as_ref()],
//         program_id.key
//     );
//     if *emitter.key != emitter_pda || emitter_bump != emitter_pda_bump {
//         return Err(ErrorCode::ConstraintSeeds.into());
//     }

//     let (sequence_pda, sequence_pda_bump) = Pubkey::find_program_address(
//         &[b"Sequence".as_ref(), &emitter.key().as_ref()],
//         bridge_id.key
//     );
//     if *sequence.key != sequence_pda || sequence_bump != sequence_pda_bump {
//         return Err(ErrorCode::ConstraintSeeds.into());
//     }

//     let (fee_collector_pda, fee_collector_pda_bump) = Pubkey::find_program_address(
//         &[b"fee_collector".as_ref()],
//         bridge_id.key
//     );
//     if *fee_collector.key != fee_collector_pda || fee_collector_bump != fee_collector_pda_bump {
//         return Err(ErrorCode::ConstraintSeeds.into());
//     }

//     Ok(())
// }

// // Build and invoke the approve instruction
// fn approve_wormhole_transfer(
//     accounts: &mut PostWormholeMessage,
//     amount: u64,
//     staking_bridge_pda_bump: u8
// ) -> Result<()> {
//     let from = &accounts.from;
//     let authority_signer = &accounts.authority_signer;
//     let from_owner = &accounts.from_owner; // PDA owned by this program which will sign the instruction

//     // https://github.com/solana-labs/solana-program-library/blob/master/token/program/src/instruction.rs#L126
//     let instruction_index: u8 = 4;
//     let data = { amount };
//     let instruction = Instruction {
//         program_id: spl_token::id(),
//         accounts: vec![
//             AccountMeta::new(from.key(), false),
//             AccountMeta::new_readonly(authority_signer.key(), false),
//             AccountMeta::new_readonly(from_owner.key(), true),
//         ],
//         data: (instruction_index, data).try_to_vec()?,
//     };
//     let accounts = [
//         from.clone(),
//         authority_signer.clone(),
//         from_owner.to_account_info().clone(),
//     ];
//     invoke_signed(
//         &instruction,
//         &accounts,
//         &[&[b"staking_bridge".as_ref(), &[staking_bridge_pda_bump]]]
//     )?;
//     msg!("Approved the transfer of {} tokens!", amount);

//     Ok(())
// }

// // Build and invoke the transfer instruction
// fn wormhole_transfer(
//     accounts: &mut PostWormholeMessage,
//     nonce: u32,
//     amount: u64,
//     fee: u64,
//     target_address: [u8; 32],
//     target_chain: u16,
//     staking_bridge_pda_bump: u8
// ) -> Result<()> {
//     let program_id = &accounts.program_id;
//     let bridge_id = &accounts.bridge_id;
//     let payer = &accounts.payer;
//     let config = &accounts.config;
//     let from = &accounts.from;
//     let from_owner = &accounts.from_owner; // PDA owned by this program which will sign the instruction
//     let wrapped_mint = &accounts.wrapped_mint;
//     let wrapped_meta = &accounts.wrapped_meta;
//     let authority_signer = &accounts.authority_signer;
//     let bridge_config = &accounts.bridge_config;
//     let message = &accounts.message;
//     let emitter = &accounts.emitter;
//     let sequence = &accounts.sequence;
//     let fee_collector = &accounts.fee_collector;
//     let clock = &accounts.clock;
//     let rent = &accounts.rent;
//     let spl_token = &accounts.spl_token;
//     let system_program = &accounts.system_program;

//     // https://github.com/wormhole-foundation/wormhole/blob/main/solana/modules/token_bridge/program/src/lib.rs#L107
//     let instruction_index: u8 = 4;
//     let data = PostWormholeMessageData {
//         nonce,
//         amount,
//         fee,
//         target_address,
//         target_chain
//     };
//     let instruction = Instruction {
//         program_id: program_id.key(),
//         accounts: vec![
//             AccountMeta::new(payer.key(), true),
//             AccountMeta::new_readonly(config.key(), false),
//             AccountMeta::new(from.key(), false),
//             AccountMeta::new_readonly(from_owner.key(), true),
//             AccountMeta::new(wrapped_mint.key(), false),
//             AccountMeta::new_readonly(wrapped_meta.key(), false),
//             AccountMeta::new_readonly(authority_signer.key(), false),
//             AccountMeta::new(bridge_config.key(), false),
//             AccountMeta::new(message.key(), true),
//             AccountMeta::new_readonly(emitter.key(), false),
//             AccountMeta::new(sequence.key(), false),
//             AccountMeta::new(fee_collector.key(), false),
//             AccountMeta::new_readonly(solana_program::sysvar::clock::id(), false),
//             AccountMeta::new_readonly(solana_program::sysvar::rent::id(), false),
//             AccountMeta::new_readonly(solana_program::system_program::id(), false),
//             AccountMeta::new_readonly(spl_token::id(), false),
//             AccountMeta::new_readonly(bridge_id.key(), false),
//         ],
//         data: (instruction_index, data).try_to_vec()?,
//     };
//     let accounts = [
//         payer.to_account_info().clone(),
//         config.clone(),
//         from.clone(),
//         from_owner.to_account_info().clone(),
//         wrapped_mint.clone(),
//         wrapped_meta.clone(),
//         authority_signer.clone(),
//         bridge_config.clone(),
//         message.to_account_info(),
//         emitter.clone(),
//         sequence.clone(),
//         fee_collector.clone(),
//         clock.to_account_info().clone(),
//         rent.to_account_info().clone(),
//         system_program.to_account_info().clone(),
//         bridge_id.to_account_info().clone(), // CHECK: Is this the correct order?
//         spl_token.to_account_info().clone(),
//     ];
//     invoke_signed(
//         &instruction,
//         &accounts,
//         &[&[b"staking_bridge".as_ref(), &[staking_bridge_pda_bump]]]
//     )?;
//     msg!("Successfully transferred {} wrapped tokens!", amount);

//     Ok(())
// }

#[program]
pub mod staking_bridge {
    use super::*;

    /**
     * Creates the PDA.
     * This instruction can be called by anyone.
     * Immediately returns successfully because Anchor handles
     * the PDA creation via the CreatePda struct account macros.
     */
    pub fn create_pda(ctx: Context<CreatePda>) -> Result<()> {
        Ok(())
    }

    pub fn raydium_swap(
        ctx: Context<RaydiumSwap>,
        amount_in: u64,
        minimum_amount_out: u64,
        vault_nonce: u64,
        staking_bridge_pda_bump: u8
    ) -> Result<()> {
        yolo()?;

        // let accounts = ctx.accounts;

        // // CHECK: check mints and token accounts and owner

        // let user_source_token_account = &accounts.user_source_token_account;
        // let user_destination_token_account = &accounts.user_destination_token_account;
        // let user_source_owner = &accounts.user_source_owner;

        // // Confirm PDA ownership of the token accounts.
        // if user_source_token_account.owner != user_source_owner.key || user_destination_token_account.owner != user_source_owner.key {
        //     return Err(ErrorCode::AccountOwnedByWrongProgram.into()); // CHECK: wrong error
        // }

        // // Confirm program ownership of the user_source_owner, i.e. the owner of the token accounts is owned by the program.
        // if *user_source_owner.owner != id() {
        //     return Err(ErrorCode::AccountOwnedByWrongProgram.into());
        // }

        // check_raydium_pdas(
        //     accounts,
        //     vault_nonce
        // )?;

        // swap(
        //     accounts,
        //     amount_in,
        //     minimum_amount_out,
        //     staking_bridge_pda_bump
        // )?;

        Ok(())
    }

    pub fn post_wormhole_message(
        ctx: Context<PostWormholeMessage>,
        nonce: u32,
        amount: u64,
        fee: u64,
        target_address: [u8; 32],
        target_chain: u16,
        token_address: [u8; 32],
        token_chain: u16,
        config_bump: u8,
        wrapped_mint_bump: u8,
        wrapped_meta_bump: u8,
        authority_signer_bump: u8,
        bridge_config_bump: u8,
        emitter_bump: u8,
        sequence_bump: u8,
        fee_collector_bump: u8,
        staking_bridge_pda_bump: u8,
    ) -> Result<()> {
        let accounts = ctx.accounts;

        // CHECK: check mints and token accounts and owner

        // CHECK: lock chain, token address, and target address

        // check_wormhole_pdas(
        //     accounts,
        //     config_bump,
        //     wrapped_mint_bump,
        //     wrapped_meta_bump,
        //     authority_signer_bump,
        //     bridge_config_bump,
        //     emitter_bump,
        //     sequence_bump,
        //     fee_collector_bump
        // )?;
        // approve_wormhole_transfer(
        //     from,
        //     authority_signer,
        //     from_owner,
        //     amount,
        //     staking_bridge_pda_bump
        // )?;
        // wormhole_transfer(
        //     accounts,
        //     nonce,
        //     amount,
        //     fee,
        //     target_address,
        //     target_chain,
        //     staking_bridge_pda_bump
        // )?;

        Ok(())
    }
}

#[derive(AnchorDeserialize, AnchorSerialize, Default)]
pub struct PostWormholeMessageData {
    pub nonce: u32,
    pub amount: u64,
    pub fee: u64,
    pub target_address: [u8; 32],
    pub target_chain: u16,
}

#[derive(Accounts)]
pub struct CreatePda<'info> {
    #[account(
        init,
        seeds = [b"staking_bridge".as_ref()],
        payer = payer,
        bump,
        space = 8
    )]
    /// CHECK: This is the PDA owned by this program. This account holds both SOL USDC and SOL AUDIO. It is used to swap between the two tokens. This PDA is also used to transfer SOL AUDIO to ETH AUDIO via the wormhole.
    pub staking_bridge_pda: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(
  _amount_in: u64,
  _minimum_amount_out: u64,
  _vault_nonce: u64,
  staking_bridge_pda_bump: u8
)]
pub struct RaydiumSwap<'info> {
    /// CHECK: This is the Raydium Liquidity Pool V4 program id
    pub program_id: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub amm: AccountInfo<'info>,
    #[account()]
    /// CHECK: ok
    pub amm_authority: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub amm_open_orders: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub amm_target_orders: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub pool_coin_token_account: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub pool_pc_token_account: AccountInfo<'info>,
    #[account()]
    /// CHECK: This is the Serum DEX program
    pub serum_program: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: This is the market address
    pub serum_market: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub serum_bids: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub serum_asks: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub serum_event_queue: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub serum_coin_vault_account: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub serum_pc_vault_account: AccountInfo<'info>,
    #[account()]
    /// CHECK: ok
    pub serum_vault_signer: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub user_source_token_account: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub user_destination_token_account: AccountInfo<'info>,
    #[account(
        seeds = [b"staking_bridge".as_ref()],
        bump = staking_bridge_pda_bump
    )]
    /// CHECK: This is the PDA initialized in the CreatePDA instruction.
    pub user_source_owner: AccountInfo<'info>,
    pub spl_token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(
    _nonce: u32,
    _amount: u64,
    _fee: u64,
    _target_address: [u8; 32],
    _target_chain: u16,
    _token_address: [u8; 32],
    _token_chain: u16,
    _config_bump: u8,
    _wrapped_mint_bump: u8,
    _wrapped_meta_bump: u8,
    _authority_signer_bump: u8,
    _bridge_config_bump: u8,
    _emitter_bump: u8,
    _sequence_bump: u8,
    _fee_collector_bump: u8,
    staking_bridge_pda_bump: u8
)]
pub struct PostWormholeMessage<'info> {
    /// CHECK: This is the Token Bridge program id
    pub program_id: AccountInfo<'info>,
    /// CHECK: This is the Core Bridge program id
    pub bridge_id: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account()]
    /// CHECK: This is the config PDA owned by the Token Bridge program_id
    pub config: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: This is the wrapped mint PDA, which also depends on the origin token chain and origin token address, owned by the Token Bridge program_id
    pub wrapped_mint: AccountInfo<'info>,
    #[account()]
    /// CHECK: This is the wrapped meta PDA, which also depends on the wrapped mint, owned by the Token Bridge program_id
    pub wrapped_meta: AccountInfo<'info>,
    #[account()]
    /// CHECK: This is the authority signer PDA owned by the Token Bridge program_id
    pub authority_signer: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: This is the bridge PDA owned by the Core Bridge bridge_id
    pub bridge_config: AccountInfo<'info>,
    #[account()]
    /// CHECK: This is the emitter PDA owned by the Token Bridge program_id
    pub emitter: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: This is the sequence PDA, which also depends on the emitter, owned by the Core Bridge bridge_id
    pub sequence: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: This is the fee collector PDA owned by the Core Bridge bridge_id
    pub fee_collector: AccountInfo<'info>,
    #[account(mut)]
    pub message: Signer<'info>,
    #[account(
        seeds = [b"staking_bridge".as_ref()],
        bump = staking_bridge_pda_bump
    )]
    #[account(mut)]
    /// CHECK: This is the PDA initialized in the CreatePDA instruction.
    pub from_owner: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: This is the associated token account of the PDA, from which the tokens will be transferred
    pub from: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,
    pub spl_token: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
