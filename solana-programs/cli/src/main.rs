use audius::{
    instruction::{
        clear_valid_signer, init_signer_group, init_valid_signer, validate_signature, SignatureData,
    },
    state::{SecpSignatureOffsets, SignerGroup, ValidSigner},
};
use borsh::BorshDeserialize;
use clap::{
    crate_description, crate_name, crate_version, value_t, value_t_or_exit, App, AppSettings, Arg,
    SubCommand,
};
use hex::FromHex;
use secp256k1::SecretKey;
use solana_clap_utils::{
    input_parsers::pubkey_of,
    input_validators::{is_keypair, is_pubkey, is_url},
    keypair::signer_from_path,
};
use solana_client::rpc_client::RpcClient;
use solana_program::pubkey::Pubkey;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    native_token::lamports_to_sol,
    secp256k1_instruction,
    signature::{Keypair, Signer},
    system_instruction,
    transaction::Transaction,
};
use std::process::exit;

#[allow(dead_code)]
struct Config {
    rpc_client: RpcClient,
    verbose: bool,
    owner: Box<dyn Signer>,
    fee_payer: Box<dyn Signer>,
    commitment_config: CommitmentConfig,
}

type Error = Box<dyn std::error::Error>;
type CommandResult = Result<Option<Transaction>, Error>;

fn is_hex(s: String) -> Result<(), String> {
    if hex::decode(s).is_err() {
        Err(String::from("Wrong address format"))
    } else {
        Ok(())
    }
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

fn command_create_signer_group(config: &Config) -> CommandResult {
    let signer_group = Keypair::new();
    println!(
        "Creating new signer group account {}",
        signer_group.pubkey()
    );

    let signer_group_account_balance = config
        .rpc_client
        .get_minimum_balance_for_rent_exemption(SignerGroup::LEN)?;
    let mut transaction = Transaction::new_with_payer(
        &[
            system_instruction::create_account(
                &config.fee_payer.pubkey(),
                &signer_group.pubkey(),
                signer_group_account_balance,
                SignerGroup::LEN as u64,
                &audius::id(),
            ),
            init_signer_group(
                &audius::id(),
                &signer_group.pubkey(),
                &config.owner.pubkey(),
            )
            .unwrap(),
        ],
        Some(&config.fee_payer.pubkey()),
    );

    let (recent_blockhash, fee_calculator) = config.rpc_client.get_recent_blockhash()?;
    check_fee_payer_balance(
        config,
        fee_calculator.calculate_fee(&transaction.message()) + signer_group_account_balance,
    )?;

    transaction.sign(
        &[config.fee_payer.as_ref(), &signer_group],
        recent_blockhash,
    );
    Ok(Some(transaction))
}

fn command_create_valid_signer(
    config: &Config,
    signer_group: &Pubkey,
    eth_address: String,
) -> CommandResult {
    let valid_signer = Keypair::new();
    println!(
        "Creating new valid signer account {}",
        valid_signer.pubkey()
    );

    let decoded_address = <[u8; SecpSignatureOffsets::ETH_ADDRESS_SIZE]>::from_hex(eth_address)
        .expect("Ethereum address decoding failed");

    let valid_signer_account_balance = config
        .rpc_client
        .get_minimum_balance_for_rent_exemption(ValidSigner::LEN)?;
    let mut transaction = Transaction::new_with_payer(
        &[
            system_instruction::create_account(
                &config.fee_payer.pubkey(),
                &valid_signer.pubkey(),
                valid_signer_account_balance,
                ValidSigner::LEN as u64,
                &audius::id(),
            ),
            init_valid_signer(
                &audius::id(),
                &valid_signer.pubkey(),
                signer_group,
                &config.owner.pubkey(),
                decoded_address,
            )
            .unwrap(),
        ],
        Some(&config.fee_payer.pubkey()),
    );

    let (recent_blockhash, fee_calculator) = config.rpc_client.get_recent_blockhash()?;
    check_fee_payer_balance(
        config,
        fee_calculator.calculate_fee(&transaction.message()) + valid_signer_account_balance,
    )?;

    transaction.sign(
        &[
            config.fee_payer.as_ref(),
            config.owner.as_ref(),
            &valid_signer,
        ],
        recent_blockhash,
    );
    Ok(Some(transaction))
}

fn command_clear_valid_signer(config: &Config, valid_signer: &Pubkey) -> CommandResult {
    // Get valid signer data
    let valid_signer_data = config.rpc_client.get_account_data(valid_signer)?;
    let valid_signer_data = ValidSigner::try_from_slice(valid_signer_data.as_slice()).unwrap();

    let mut transaction = Transaction::new_with_payer(
        &[clear_valid_signer(
            &audius::id(),
            valid_signer,
            &valid_signer_data.signer_group,
            &config.owner.pubkey(),
        )
        .unwrap()],
        Some(&config.fee_payer.pubkey()),
    );

    let (recent_blockhash, fee_calculator) = config.rpc_client.get_recent_blockhash()?;
    check_fee_payer_balance(config, fee_calculator.calculate_fee(&transaction.message()))?;

    transaction.sign(
        &[config.fee_payer.as_ref(), config.owner.as_ref()],
        recent_blockhash,
    );
    Ok(Some(transaction))
}

fn command_send_message(
    config: &Config,
    valid_signer: &Pubkey,
    secret_key: String,
    message: String,
) -> CommandResult {
    // Get valid signer data
    let valid_signer_data = config.rpc_client.get_account_data(valid_signer)?;
    let valid_signer_data = ValidSigner::try_from_slice(valid_signer_data.as_slice()).unwrap();

    let decoded_secret =
        <[u8; 32]>::from_hex(secret_key).expect("Secp256k1 secret key decoding failed");
    let private_key = SecretKey::parse(&decoded_secret).unwrap();
    let message = message.as_bytes().to_vec();

    let secp256_program_instruction =
        secp256k1_instruction::new_secp256k1_instruction(&private_key, &message);

    let start = 1;
    let end = start + SecpSignatureOffsets::SIGNATURE_OFFSETS_SERIALIZED_SIZE;

    let offsets =
        SecpSignatureOffsets::try_from_slice(&secp256_program_instruction.data[start..end])
            .unwrap();

    let sig_start = offsets.signature_offset as usize;
    let sig_end = sig_start + SecpSignatureOffsets::SECP_SIGNATURE_SIZE;

    let mut signature: [u8; SecpSignatureOffsets::SECP_SIGNATURE_SIZE] =
        [0u8; SecpSignatureOffsets::SECP_SIGNATURE_SIZE];
    signature.copy_from_slice(&secp256_program_instruction.data[sig_start..sig_end]);

    let recovery_id = secp256_program_instruction.data[sig_end];

    let signature_data = SignatureData {
        signature,
        recovery_id,
        message: message.to_vec(),
    };

    let mut transaction = Transaction::new_with_payer(
        &[
            secp256_program_instruction,
            validate_signature(
                &audius::id(),
                valid_signer,
                &valid_signer_data.signer_group,
                signature_data,
            )
            .unwrap(),
        ],
        Some(&config.fee_payer.pubkey()),
    );

    let (recent_blockhash, fee_calculator) = config.rpc_client.get_recent_blockhash()?;
    check_fee_payer_balance(config, fee_calculator.calculate_fee(&transaction.message()))?;

    transaction.sign(&[config.fee_payer.as_ref()], recent_blockhash);
    Ok(Some(transaction))
}

fn main() {
    let matches = App::new(crate_name!())
        .about(crate_description!())
        .version(crate_version!())
        .setting(AppSettings::SubcommandRequiredElseHelp)
        .arg({
            let arg = Arg::with_name("config_file")
                .short("C")
                .long("config")
                .value_name("PATH")
                .takes_value(true)
                .global(true)
                .help("Configuration file to use");
            if let Some(ref config_file) = *solana_cli_config::CONFIG_FILE {
                arg.default_value(&config_file)
            } else {
                arg
            }
        })
        .arg(
            Arg::with_name("verbose")
                .long("verbose")
                .short("v")
                .takes_value(false)
                .global(true)
                .help("Show additional information"),
        )
        .arg(
            Arg::with_name("json_rpc_url")
                .long("url")
                .value_name("URL")
                .takes_value(true)
                .validator(is_url)
                .help("JSON RPC URL for the cluster.  Default from the configuration file."),
        )
        .arg(
            Arg::with_name("owner")
                .long("owner")
                .value_name("KEYPAIR")
                .validator(is_keypair)
                .takes_value(true)
                .help(
                    "Specify the signer group's owner. \
                     This may be a keypair file, the ASK keyword. \
                     Defaults to the client keypair.",
                ),
        )
        .arg(
            Arg::with_name("fee_payer")
                .long("fee-payer")
                .value_name("KEYPAIR")
                .validator(is_keypair)
                .takes_value(true)
                .help(
                    "Specify the fee-payer account. \
                     This may be a keypair file, the ASK keyword. \
                     Defaults to the client keypair.",
                ),
        )
        .subcommand(SubCommand::with_name("create-signer-group").about("Create a new signer group"))
        .subcommand(
            SubCommand::with_name("create-valid-signer")
                .about("Create new valid signer and add to the signer group")
                .arg(
                    Arg::with_name("signer_group")
                        .index(1)
                        .validator(is_pubkey)
                        .value_name("ADDRESS")
                        .takes_value(true)
                        .required(true)
                        .help("Group for Valid Signer to join with."),
                )
                .arg(
                    Arg::with_name("eth_address")
                        .index(2)
                        .validator(is_hex)
                        .value_name("ETH_ADDRESS")
                        .takes_value(true)
                        .required(true)
                        .help("Ethereum address calculated valid signer's private key (without 0x prefix)."),
                ),
        )
        .subcommand(
            SubCommand::with_name("clear-valid-signer")
                .about("Remove valid signer from the signer group")
                .arg(
                    Arg::with_name("valid_signer")
                        .index(1)
                        .validator(is_pubkey)
                        .value_name("ADDRESS")
                        .takes_value(true)
                        .required(true)
                        .help("Account of valid signer to be removed."),
                ),
        )
        .subcommand(
            SubCommand::with_name("send-message")
                .about("Validate signer's signature")
                .arg(
                    Arg::with_name("valid_signer")
                        .index(1)
                        .validator(is_pubkey)
                        .value_name("ADDRESS")
                        .takes_value(true)
                        .required(true)
                        .help("Account of valid signer."),
                )
                .arg(
                    Arg::with_name("secret_key")
                        .index(2)
                        .value_name("SECRET")
                        .takes_value(true)
                        .required(true)
                        .help("Valid signer's private key."),
                )
                .arg(
                    Arg::with_name("message")
                        .index(3)
                        .value_name("MESSAGE")
                        .takes_value(true)
                        .required(true)
                        .help("Message to sign and send."),
                ),
        )
        .get_matches();

    let mut wallet_manager = None;
    let config = {
        let cli_config = if let Some(config_file) = matches.value_of("config_file") {
            solana_cli_config::Config::load(config_file).unwrap_or_default()
        } else {
            solana_cli_config::Config::default()
        };
        let json_rpc_url = value_t!(matches, "json_rpc_url", String)
            .unwrap_or_else(|_| cli_config.json_rpc_url.clone());

        let owner = signer_from_path(
            &matches,
            &cli_config.keypair_path,
            "owner",
            &mut wallet_manager,
        )
        .unwrap_or_else(|e| {
            eprintln!("error: {}", e);
            exit(1);
        });
        let fee_payer = signer_from_path(
            &matches,
            &cli_config.keypair_path,
            "fee_payer",
            &mut wallet_manager,
        )
        .unwrap_or_else(|e| {
            eprintln!("error: {}", e);
            exit(1);
        });
        let verbose = matches.is_present("verbose");

        Config {
            rpc_client: RpcClient::new(json_rpc_url),
            verbose,
            owner,
            fee_payer,
            commitment_config: CommitmentConfig::confirmed(),
        }
    };

    solana_logger::setup_with_default("solana=info");

    let _ = match matches.subcommand() {
        ("create-signer-group", Some(_)) => command_create_signer_group(&config),
        ("create-valid-signer", Some(arg_matches)) => {
            let signer_group: Pubkey = pubkey_of(arg_matches, "signer_group").unwrap();
            let eth_address: String = value_t_or_exit!(arg_matches, "eth_address", String);
            command_create_valid_signer(&config, &signer_group, eth_address)
        }
        ("clear-valid-signer", Some(arg_matches)) => {
            let valid_signer: Pubkey = pubkey_of(arg_matches, "valid_signer").unwrap();
            command_clear_valid_signer(&config, &valid_signer)
        }
        ("send-message", Some(arg_matches)) => {
            let valid_signer: Pubkey = pubkey_of(arg_matches, "valid_signer").unwrap();
            let secret_key: String = value_t_or_exit!(arg_matches, "secret_key", String);
            let message: String = value_t_or_exit!(arg_matches, "message", String);
            command_send_message(&config, &valid_signer, secret_key, message)
        }
        _ => unreachable!(),
    }
    .and_then(|transaction| {
        if let Some(transaction) = transaction {
            let signature = config
                .rpc_client
                .send_and_confirm_transaction_with_spinner_and_commitment(
                    &transaction,
                    config.commitment_config,
                )?;
            println!("Signature: {}", signature);
        }
        Ok(())
    })
    .map_err(|err| {
        eprintln!("{}", err);
        exit(1);
    });
}
