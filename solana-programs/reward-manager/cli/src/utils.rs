//! Extended functionality
use crate::{Config, Error};
use regex::Regex;
use serde::Deserialize;
use sha3::Digest;
use solana_program::instruction::Instruction;
use solana_sdk::{
    native_token::lamports_to_sol,
    secp256k1_instruction::{
        construct_eth_pubkey, SecpSignatureOffsets, DATA_START, SIGNATURE_SERIALIZED_SIZE,
    },
    signature::Signer,
    transaction::Transaction as OnchainTransaction,
};

/// Struct to deserialize key from csv file
#[derive(Debug, Deserialize)]
pub struct SenderData {
    pub solana_key: String,
    pub eth_secret: String,
}

pub const ETH_ADDRESS_PREFIX: &str = "0x";

pub fn is_hex(s: String) -> Result<(), String> {
    if hex::decode(s).is_err() {
        Err(String::from("Wrong hex string"))
    } else {
        Ok(())
    }
}

pub fn is_eth_address(s: String) -> Result<(), String> {
    if s.get(0..2).unwrap() != ETH_ADDRESS_PREFIX {
        return Err(String::from("Wrong address prefix"));
    }
    is_hex(String::from(s.get(2..).unwrap()))
}

pub fn is_csv_file(s: String) -> Result<(), String> {
    let re = Regex::new(r".+\.csv$").unwrap();
    if re.is_match(s.as_ref()) {
        return Ok(());
    }
    Err(String::from("Receive wrong path to csv file"))
}

fn check_fee_payer_balance(config: &Config, required_balance: u64) -> Result<(), Error> {
    let balance = config.rpc_client.get_balance(&config.fee_payer.pubkey())?;
    if balance < required_balance {
        Err(format!(
            "Fee payer, {}, has insufficient balance: {} required, {} available",
            config.fee_payer.pubkey(),
            lamports_to_sol(required_balance),
            lamports_to_sol(balance)
        )
        .into())
    } else {
        Ok(())
    }
}

/// Transaction
pub struct Transaction<'a> {
    ///
    pub instructions: Vec<Instruction>,
    ///
    pub signers: Vec<&'a dyn Signer>,
}

impl<'a> Transaction<'a> {
    pub fn sign(
        self,
        config: &Config,
        additional_balance_required: u64,
    ) -> Result<Option<OnchainTransaction>, Error> {
        let mut transaction = OnchainTransaction::new_with_payer(
            self.instructions.as_ref(),
            Some(&config.fee_payer.pubkey()),
        );

        let (recent_blockhash, fee_calculator) = config.rpc_client.get_recent_blockhash()?;
        check_fee_payer_balance(
            config,
            fee_calculator.calculate_fee(&transaction.message()) + additional_balance_required,
        )?;

        transaction.sign(&self.signers, recent_blockhash);

        Ok(Some(transaction))
    }
}

pub fn sign_message(message: &[u8], signers: Vec<libsecp256k1::SecretKey>) -> Vec<Instruction> {
    let mut secp_instructions = Vec::new();

    for (index, signer) in signers.iter().enumerate() {
        secp_instructions.push(new_secp256k1_instruction_2_0(signer, message, index as u8));
    }

    secp_instructions
}

pub fn new_secp256k1_instruction_2_0(
    priv_key: &libsecp256k1::SecretKey,
    message_arr: &[u8],
    instruction_index: u8,
) -> Instruction {
    let secp_pubkey = libsecp256k1::PublicKey::from_secret_key(priv_key);
    let eth_pubkey = construct_eth_pubkey(&secp_pubkey);
    let mut hasher = sha3::Keccak256::new();
    hasher.update(&message_arr);
    let message_hash = hasher.finalize();
    let mut message_hash_arr = [0u8; 32];
    message_hash_arr.copy_from_slice(&message_hash.as_slice());
    let message = libsecp256k1::Message::parse(&message_hash_arr);
    let (signature, recovery_id) = libsecp256k1::sign(&message, priv_key);
    let signature_arr = signature.serialize();
    assert_eq!(signature_arr.len(), SIGNATURE_SERIALIZED_SIZE);

    let mut instruction_data = vec![];
    instruction_data.resize(
        DATA_START
            .saturating_add(eth_pubkey.len())
            .saturating_add(signature_arr.len())
            .saturating_add(message_arr.len())
            .saturating_add(1),
        0,
    );
    let eth_address_offset = DATA_START;
    instruction_data[eth_address_offset..eth_address_offset.saturating_add(eth_pubkey.len())]
        .copy_from_slice(&eth_pubkey);

    let signature_offset = DATA_START.saturating_add(eth_pubkey.len());
    instruction_data[signature_offset..signature_offset.saturating_add(signature_arr.len())]
        .copy_from_slice(&signature_arr);

    instruction_data[signature_offset.saturating_add(signature_arr.len())] =
        recovery_id.serialize();

    let message_data_offset = signature_offset
        .saturating_add(signature_arr.len())
        .saturating_add(1);
    instruction_data[message_data_offset..].copy_from_slice(message_arr);

    let num_signatures = 1;
    instruction_data[0] = num_signatures;
    let offsets = SecpSignatureOffsets {
        signature_offset: signature_offset as u16,
        signature_instruction_index: instruction_index,
        eth_address_offset: eth_address_offset as u16,
        eth_address_instruction_index: instruction_index,
        message_data_offset: message_data_offset as u16,
        message_data_size: message_arr.len() as u16,
        message_instruction_index: instruction_index,
    };
    let writer = std::io::Cursor::new(&mut instruction_data[1..DATA_START]);
    bincode::serialize_into(writer, &offsets).unwrap();

    Instruction {
        program_id: solana_sdk::secp256k1_program::id(),
        accounts: vec![],
        data: instruction_data,
    }
}
