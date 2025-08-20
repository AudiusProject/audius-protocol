//! Instruction types

use crate::utils::program::{find_address_pair, find_rent_destination_pda_address, EthereumAddress};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    instruction::{AccountMeta, Instruction},
    program_error::ProgramError,
    pubkey::Pubkey,
    system_program, sysvar,
};

/// Eth address
#[derive(Clone, BorshDeserialize, BorshSerialize, PartialEq, Debug)]
pub struct CreateTokenAccount {
    /// Ethereum address
    pub eth_address: EthereumAddress,
}

/// Args to CreateTokenAccountV2 instruction
#[derive(Clone, BorshDeserialize, BorshSerialize, PartialEq, Debug)]
pub struct CreateTokenAccountV2 {
    /// Ethereum address
    pub eth_address: EthereumAddress,
    /// Account to receive rent when closing token account
    pub rent_destination: Pubkey,
}

/// Instruction definition
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Debug, Clone)]
pub enum ClaimableProgramInstruction {
    /// CreateTokenAccount
    ///
    ///   0. `[sw]` Account to pay for creating token acc
    ///   1. `[r]` Mint account
    ///   2. `[r]` Base acc used in PDA token acc (need because of create_with_seed instruction)
    ///   3. `[w]` PDA token account to create
    ///   4. `[r]` Rent id
    ///   5. `[r]` SPL token account id
    ///   6. `[r]` System program id
    CreateTokenAccount(CreateTokenAccount),

    /// Transfer
    ///
    ///   0. `[sw]` Account to pay for transfer
    ///   1. `[w]` Token acc from which tokens will be send (bank account)
    ///   2. `[w]` Receiver token acc
    ///   3. `[w]` Nonce acc
    ///   4. `[r]` Banks token account authority
    ///   5. `[r]` Rent id
    ///   6. `[r]` Sysvar instruction id
    ///   7. `[r]` System program id
    ///   8. `[r]` SPL token account id
    Transfer(EthereumAddress),

    /// CloseTokenAccount
    ///
    ///   0. `[w]` Rent destination
    ///   1. `[w]` Token acc to close
    ///   2. `[r]` Banks token account authority
    ///   3. `[w]` Rent destination PDA
    ///   4. `[r]` SPL token account id
    ///   5. `[r]` System program id
    CloseTokenAccount(EthereumAddress),

    /// CreateTokenAccountV2
    /// 
    ///   0. `[sw]` Account to pay for creating token acc
    ///   1. `[w]` Rent destination PDA
    ///   2. `[r]` Mint account
    ///   3. `[r]` Base acc used in PDA token acc (need because of create_with_seed instruction)
    ///   4. `[w]` PDA token account to create
    ///   5. `[r]` Rent id
    ///   6. `[r]` SPL token account id
    ///   7. `[r]` System program id
    CreateTokenAccountV2(CreateTokenAccountV2),
}

/// Create `CreateTokenAccount` instruction
pub fn init(
    program_id: &Pubkey,
    fee_payer: &Pubkey,
    mint: &Pubkey,
    ethereum_address: CreateTokenAccount,
) -> Result<Instruction, ProgramError> {
    let pair = find_address_pair(program_id, mint, ethereum_address.eth_address)?;

    let data = ClaimableProgramInstruction::CreateTokenAccount(ethereum_address).try_to_vec()?;
    let accounts = vec![
        AccountMeta::new(*fee_payer, true),
        AccountMeta::new_readonly(*mint, false),
        AccountMeta::new_readonly(pair.base.address, false),
        AccountMeta::new(pair.derive.address, false),
        AccountMeta::new_readonly(sysvar::rent::id(), false),
        AccountMeta::new_readonly(spl_token::id(), false),
        AccountMeta::new_readonly(system_program::id(), false),
    ];
    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

/// Create `CreateTokenAccountV2` instruction
pub fn init_v2(
    program_id: &Pubkey,
    fee_payer: &Pubkey,
    mint: &Pubkey,
    eth_address: EthereumAddress,
    rent_destination: Option<&Pubkey>,
) -> Result<Instruction, ProgramError> {
    let pair = find_address_pair(program_id, mint, eth_address)?;
    let (_base_account, rent_destination_pda, _bump) = 
        find_rent_destination_pda_address(program_id, mint, &eth_address);

    let data = ClaimableProgramInstruction::CreateTokenAccountV2(
        CreateTokenAccountV2 {
            eth_address,
            rent_destination: *rent_destination.unwrap_or(fee_payer)
        }
    ).try_to_vec()?;
    let accounts = vec![
        AccountMeta::new(*fee_payer, true),
        AccountMeta::new(rent_destination_pda, false),
        AccountMeta::new_readonly(*mint, false),
        AccountMeta::new_readonly(pair.base.address, false),
        AccountMeta::new(pair.derive.address, false),
        AccountMeta::new_readonly(sysvar::rent::id(), false),
        AccountMeta::new_readonly(spl_token::id(), false),
        AccountMeta::new_readonly(system_program::id(), false),
    ];
    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

/// Create `Transfer` instruction
///
/// NOTE: Instruction must followed after `new_secp256k1_instruction`
/// with params: ethereum private key and user token account public key.
/// Otherwise error message `Secp256 instruction losing` will be issued
pub fn transfer(
    program_id: &Pubkey,
    fee_payer: &Pubkey,
    banks_token_acc: &Pubkey,
    users_token_acc: &Pubkey,
    users_nonce_acc: &Pubkey,
    authority: &Pubkey,
    eth_address: EthereumAddress,
) -> Result<Instruction, ProgramError> {
    let data = ClaimableProgramInstruction::Transfer(eth_address).try_to_vec()?;
    let accounts = vec![
        AccountMeta::new(*fee_payer, true),
        AccountMeta::new(*banks_token_acc, false),
        AccountMeta::new(*users_token_acc, false),
        AccountMeta::new(*users_nonce_acc, false),
        AccountMeta::new_readonly(*authority, false),
        AccountMeta::new_readonly(sysvar::rent::id(), false),
        AccountMeta::new_readonly(sysvar::instructions::id(), false),
        // A reference to the token and system programs is needed even if unused directly
        // Below are required in function scope for allocation of a new account
        AccountMeta::new_readonly(system_program::id(), false),
        AccountMeta::new_readonly(spl_token::id(), false),
    ];
    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

/// Create `CloseTokenAccount` instruction
pub fn close(
    program_id: &Pubkey,
    rent_destination: &Pubkey,
    token_acc: &Pubkey,
    bank_authority: &Pubkey,
    mint: &Pubkey,
    eth_address: EthereumAddress,
) -> Result<Instruction, ProgramError> {
    let data = ClaimableProgramInstruction::CloseTokenAccount(eth_address).try_to_vec()?;
    let rent_destination_pda = find_rent_destination_pda_address(program_id, mint, &eth_address).1;
    let accounts = vec![
        AccountMeta::new(*rent_destination, false),
        AccountMeta::new(*token_acc, false),
        AccountMeta::new_readonly(*bank_authority, false),
        AccountMeta::new(rent_destination_pda, false),
        AccountMeta::new_readonly(spl_token::id(), false),
        AccountMeta::new_readonly(system_program::id(), false),
    ];
    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}