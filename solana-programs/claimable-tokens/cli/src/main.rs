use std::convert::TryInto;

use anyhow::anyhow;
use anyhow::{bail, Context};
use claimable_tokens::{
    instruction::{Claim, CreateTokenAccount},
    utils::program::{get_address_pair, EthereumAddress},
};
use clap::{
    crate_description, crate_name, crate_version, value_t, App, AppSettings, Arg, ArgMatches,
    SubCommand,
};
use solana_clap_utils::{
    fee_payer::fee_payer_arg,
    input_parsers::pubkey_of,
    input_validators::{is_pubkey, is_url_or_moniker, is_valid_signer},
    keypair::signer_from_path,
};
use solana_client::{rpc_client::RpcClient, rpc_response::Response};
use solana_sdk::{
    account::ReadableAccount,
    commitment_config::CommitmentConfig,
    program_pack::Pack,
    pubkey::Pubkey,
    secp256k1_instruction::{construct_eth_pubkey, new_secp256k1_instruction},
    signature::Signer,
    transaction::Transaction,
};
use spl_associated_token_account::{create_associated_token_account, get_associated_token_address};
use spl_token::state::{Account, Mint};
use solana_program::instruction::Instruction;

struct Config {
    owner: Box<dyn Signer>,
    fee_payer: Box<dyn Signer>,
    rpc_client: RpcClient,
}

fn handle_hex_prefix(hex_str: &mut String) {
    if hex_str.starts_with("0x") {
        hex_str.replace_range(..=1, "");
    }
}

fn eth_address_of(matches: &ArgMatches<'_>, name: &str) -> anyhow::Result<EthereumAddress> {
    let mut value = value_t!(matches.value_of(name), String)?;
    handle_hex_prefix(&mut value);
    let decoded_pk = hex::decode(value.as_str())?;
    decoded_pk
        .try_into()
        .map_err(|op: Vec<u8>| anyhow!("Address len must be 20, but current is {}", op.len()))
}

fn eth_seckey_of(matches: &ArgMatches<'_>, name: &str) -> anyhow::Result<libsecp256k1::SecretKey> {
    let mut value = value_t!(matches.value_of(name), String)?;
    handle_hex_prefix(&mut value);
    let decoded_pk = &hex::decode(value.as_str())?;
    let sk = libsecp256k1::SecretKey::parse_slice(decoded_pk)?;
    Ok(sk)
}

fn calculate_and_create_associated_key(
    config: &Config,
    mint: &Pubkey,
) -> anyhow::Result<Pubkey> {

    let calculated_key =
        spl_associated_token_account::get_associated_token_address(&config.owner.pubkey(), &mint);

    if !token_account_initialized(config, &calculated_key) {
        bail!("Command processing was interrupted because owner token account isn't initialized.")
    }
    Ok(calculated_key)
}

fn token_account_initialized(config: &Config, key: &Pubkey) -> bool {
    let token_acc_data = config.rpc_client.get_account_data(&key).ok();
    if let Some(acc_data) = token_acc_data {
        let token_acc = Account::unpack(acc_data.as_slice());

        if token_acc.is_ok() {
            return true;
        }
    }
    false
}

fn transfer(
    config: Config,
    secret_key: libsecp256k1::SecretKey,
    mint: Pubkey,
    recipient: Option<Pubkey>,
    amount: f64,
) -> anyhow::Result<()> {
    let mut instructions = vec![];

    let eth_pubkey = libsecp256k1::PublicKey::from_secret_key(&secret_key);
    let eth_address = construct_eth_pubkey(&eth_pubkey);
    let pair = get_address_pair(&claimable_tokens::id(), &mint, eth_address)?;

    // If `recipient` token account provided - we will use it,
    // otherwise will use token account associated with `config.owner`
    let user_acc = recipient.map_or_else(
        || -> anyhow::Result<Pubkey> {
            let user_acc = get_associated_token_address(&config.owner.pubkey(), &mint);
            // Checks, if the associated token account exist otherwise,
            // we must add instruction to create it
            if let Response {
                value: Some(account),
                ..
            } = config
                .rpc_client
                .get_account_with_commitment(&user_acc, config.rpc_client.commitment())?
            {
                // Unpack for checking that is token account
                let account_data = Account::unpack(account.data())?;

                // Check that account's mint correct
                if account_data.mint != mint {
                    bail!("Associated token account has incorrect mint");
                }

                // Checking that mint account exist
                let mint_acc_response = config
                    .rpc_client
                    .get_account_with_commitment(&mint, config.rpc_client.commitment())?;
                // Unpack for checking that is mint account
                Mint::unpack(mint_acc_response.value.unwrap().data())?;
            } else {
                instructions.push(create_associated_token_account(
                    &config.fee_payer.pubkey(),
                    &config.owner.pubkey(),
                    &mint,
                ));
            }

            Ok(user_acc)
        },
        Ok,
    )?;

    let mint_raw_data = config.rpc_client.get_account_data(&mint)?;
    let mint_data = Mint::unpack(mint_raw_data.as_ref())?;

    let instructions = &[
        new_secp256k1_instruction(&secret_key, &user_acc.to_bytes()),
        claimable_tokens::instruction::claim(
            &claimable_tokens::id(),
            &pair.derive.address,
            &user_acc,
            &pair.base.address,
            Claim {
                eth_address,
                amount: spl_token::ui_amount_to_amount(amount, mint_data.decimals),
            },
        )?,
    ];
    let mut tx = Transaction::new_with_payer(instructions, Some(&config.fee_payer.pubkey()));
    let (recent_blockhash, _) = config.rpc_client.get_recent_blockhash()?;
    tx.sign(&[config.fee_payer.as_ref()], recent_blockhash);
    let tx_hash = config
        .rpc_client
        .send_and_confirm_transaction_with_spinner(&tx)?;
    println!("Claim completed, transaction hash: {:?}", tx_hash);
    Ok(())
}

fn send_to(config: Config, eth_address: [u8; 20], mint: Pubkey, amount: f64) -> anyhow::Result<()> {
    let mut instructions: Vec<Instruction> = vec![];

    let pair = get_address_pair(&claimable_tokens::id(), &mint, eth_address)?;
    // Checking if the derived address of recipient does not exist
    // then we must add instruction to create it
    let derived_token_acc_data = config.rpc_client.get_account_data(&pair.derive.address);
    if derived_token_acc_data.is_err() {
        instructions.push(claimable_tokens::instruction::init(
            &claimable_tokens::id(),
            &config.fee_payer.pubkey(),
            &mint,
            CreateTokenAccount { eth_address },
        )?);
    }

    let mint_raw_data = config.rpc_client.get_account_data(&mint)?;
    let mint_data = Mint::unpack(mint_raw_data.as_ref())?;

    let account = calculate_and_create_associated_key(&config, &mint)?;

    instructions.push(spl_token::instruction::transfer(
        &spl_token::id(),
        &account,
        &pair.derive.address,
        &config.owner.pubkey(),
        &[&config.owner.pubkey()],
        spl_token::ui_amount_to_amount(amount, mint_data.decimals),
    )?);

    let mut tx =
        Transaction::new_with_payer(instructions.as_slice(), Some(&config.fee_payer.pubkey()));
    let (recent_blockhash, _) = config.rpc_client.get_recent_blockhash()?;
    tx.sign(
        &[config.fee_payer.as_ref(), config.owner.as_ref()],
        recent_blockhash,
    );
    let tx_hash = config
        .rpc_client
        .send_and_confirm_transaction_with_spinner(&tx)?;

    println!("Transfer completed to recipient: {}\nTransaction hash: {:?}", pair.derive.address, tx_hash);
    Ok(())
}

fn balance(config: Config, eth_address: EthereumAddress, mint: Pubkey) -> anyhow::Result<()> {
    let pair = get_address_pair(&claimable_tokens::id(), &mint, eth_address)?;

    if let Response {
        value: Some(account),
        ..
    } = config
        .rpc_client
        .get_token_account_with_commitment(&pair.derive.address, config.rpc_client.commitment())?
    {
        println!(
            "Address balance: {}",
            account.token_amount.ui_amount.unwrap()
        );
    } else {
        println!("Address not found");
    }

    Ok(())
}

fn main() -> anyhow::Result<()> {
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
            Arg::with_name("json_rpc_url")
                .short("u")
                .long("url")
                .value_name("URL_OR_MONIKER")
                .takes_value(true)
                .global(true)
                .validator(is_url_or_moniker)
                .help(
                    "URL for Solana's JSON RPC or moniker (or their first letter): \
                   [mainnet-beta, testnet, devnet, localhost] \
                Default from the configuration file.",
                ),
        )
        .arg(
            Arg::with_name("owner")
                .long("owner")
                .value_name("KEYPAIR")
                .validator(is_valid_signer)
                .takes_value(true)
                .global(true)
                .help(
                    "Specify the token owner account. \
             This may be a keypair file, the ASK keyword. \
             Defaults to the client keypair.",
                ),
        )
        .arg(fee_payer_arg().global(true))
        .subcommands(vec![
            SubCommand::with_name("send-to")
                .args(&[
                    Arg::with_name("recipient")
                        .value_name("ETHEREUM_ADDRESS")
                        .takes_value(true)
                        .required(true)
                        .help("Recipient Ethereum address"),
                    Arg::with_name("mint")
                        .value_name("MINT_ADDRESS")
                        .takes_value(true)
                        .required(true)
                        .help("Mint for the token to send"),
                    Arg::with_name("amount")
                        .value_name("NUMBER")
                        .takes_value(true)
                        .required(true)
                        .help("Amount to send"),
                ])
                .help("Sends some amount of tokens of specified mint to the Solana account associated with Ethereum address."),
            SubCommand::with_name("transfer").args(&[
                Arg::with_name("mint")
                    .validator(is_pubkey)
                    .value_name("MINT_ADDRESS")
                    .takes_value(true)
                    .required(true)
                    .help("Mint for token to claim"),
                Arg::with_name("private_key")
                    .value_name("ETHEREUM_PRIVATE_KEY")
                    .takes_value(true)
                    .required(true)
                    .help("Ethereum private key to sign the transaction"),
                Arg::with_name("amount")
                    .value_name("NUMBER")
                    .takes_value(true)
                    .required(true)
                    .help("Amount to claim"),
                Arg::with_name("recipient")
                    .long("recipient")
                    .validator(is_pubkey)
                    .value_name("SOLANA_ADDRESS")
                    .takes_value(true)
                    .help("Recipient of transfer."),
                ])
                .help("Transfers some amount of tokens from your account associated with Ethereum address to another account."),
            SubCommand::with_name("balance").args(&[
                Arg::with_name("address")
                    .value_name("ETHEREUM_ADDRESS")
                    .takes_value(true)
                    .required(true)
                    .help("Ethereum address"),
                Arg::with_name("mint")
                    .value_name("MINT_ADDRESS")
                    .takes_value(true)
                    .required(true)
                    .help("Mint of tokens that hold at associated account."),
            ]),
            SubCommand::with_name("generate-base-pda").args(&[
                Arg::with_name("mint")
                    .value_name("MINT_ADDRESS")
                    .takes_value(true)
                    .required(true)
                    .help("Token mint account"),
                Arg::with_name("program_id")
                    .value_name("PROGRAM_ID")
                    .takes_value(true)
                    .required(true)
                    .help("Program Id address"),
            ])
                .help("Receives balance of account that associated with Ethereum address and specific mint."),
        ])
        .get_matches();

    let mut wallet_manager = None;

    let cli_config = if let Some(config_file) = matches.value_of("config_file") {
        solana_cli_config::Config::load(config_file)?
    } else {
        println!("Config file not provided and default config does not exist. Create config");
        solana_cli_config::Config::default()
    };
    let json_rpc_url = value_t!(matches, "json_rpc_url", String)
        .unwrap_or_else(|_| cli_config.json_rpc_url.clone());
    let owner = signer_from_path(
        &matches,
        matches
            .value_of("owner")
            .unwrap_or(&cli_config.keypair_path),
        "owner",
        &mut wallet_manager,
    )
    .expect("Keypair for set owner cannot be found in path");
    let fee_payer = signer_from_path(
        &matches,
        matches
            .value_of("fee_payer")
            .unwrap_or(&cli_config.keypair_path),
        "fee_payer",
        &mut wallet_manager,
    )
    .expect("Keypair for set fee pair cannot be found in path");

    let config = Config {
        owner,
        fee_payer,
        rpc_client: RpcClient::new_with_commitment(json_rpc_url, CommitmentConfig::confirmed()),
    };

    solana_logger::setup_with_default("solana=info");

    match matches.subcommand() {
        ("transfer", Some(args)) => {
            let (privkey, mint, recipient, amount) = (|| -> anyhow::Result<_> {
                let privkey = eth_seckey_of(args, "private_key")?;
                let mint = pubkey_of(args, "mint").unwrap();
                let recipient = pubkey_of(args, "recipient");
                let amount = value_t!(args.value_of("amount"), f64)?;

                Ok((privkey, mint, recipient, amount))
            })()
            .context("Preparing parameters for execution command `transfer`")?;

            transfer(config, privkey, mint, recipient, amount)
                .context("Failed to execute `transfer` command")?
        }
        ("send-to", Some(args)) => {
            let (eth_address, mint, amount) = (|| -> anyhow::Result<_> {
                let eth_address = eth_address_of(args, "recipient")?;
                let mint = pubkey_of(args, "mint").unwrap();
                let amount = value_t!(args.value_of("amount"), f64)?;

                Ok((eth_address, mint, amount))
            })()
            .context("Preparing parameters for execution command `send to`")?;

            send_to(config, eth_address, mint, amount)
                .context("Failed to execute `send to` command")?
        }
        ("balance", Some(args)) => {
            let (eth_address, mint) = (|| -> anyhow::Result<_> {
                let eth_address = eth_address_of(args, "address")?;
                let mint = pubkey_of(args, "recipient").unwrap();

                Ok((eth_address, mint))
            })()
            .context("Preparing parameters for execution command `balance`")?;

            balance(config, eth_address, mint).context("Failed to execute `balance` command")?
        }
        ("generate-base-pda", Some(args)) => {
            let _base_account = (|| -> anyhow::Result<_> {
                let mint = pubkey_of(args, "mint").unwrap();
                let program_id = pubkey_of(args, "program_id").unwrap();
                println!("Recieved mint {:?}", mint);
                println!("Recieved program_id {:?}", program_id);
                let program_base_address = Pubkey::find_program_address(
                    &[&mint.to_bytes()[..32]],
                    &program_id
                );
                println!("Recieved program_base_address {:?}", program_base_address);

                Ok(program_base_address)
            })()
            .context("Preparing parameters for execution command `send to`")?;
       }
        _ => unreachable!(),
    }
    Ok(())
}

#[test]
fn test_eth_address_gen_from_secret() {
    use secp256k1::*;

    const INPUT_PV: &str = "a53b70c96e7960f1dc295c13fc4c6598a94cd6e98c418e5d4f33146402d13935";
    let private = SecretKey::parse_slice(&hex::decode(INPUT_PV).unwrap().as_slice()).unwrap();
    let eth_address = secp256k1::PublicKey::from_secret_key(&private);
    let hashed_eth_pk = construct_eth_pubkey(&eth_address);
    assert_eq!(
        "7f14493c18aa7ff329a3cbd8309296f1ab838c21",
        hex::encode(hashed_eth_pk)
    );
}

#[test]
fn test_parse_eth_pv() {
    use secp256k1::*;
    use std::str;

    const INPUT_PV: &str = "09e910621c2e988e9f7f6ffcd7024f54ec1461fa6e86a4b545e9e1fe21c28866";
    const EXPECTED_PUB: &str = "048e66b3e549818ea2cb354fb70749f6c8de8fa484f7530fc447d5fe80a1c424e4f5ae648d648c980ae7095d1efad87161d83886ca4b6c498ac22a93da5099014a";

    let private = SecretKey::parse_slice(&hex::decode(INPUT_PV).unwrap().as_slice()).unwrap();
    let public = PublicKey::from_secret_key(&private);
    let serialized = public.serialize();
    let str_pub = hex::decode(EXPECTED_PUB).unwrap();

    assert_eq!(&str_pub, serialized.as_ref());
}
