#![cfg(feature = "test-bpf")]

use anchor_lang::prelude::{
  AccountInfo,
  Pubkey,
  Error,
};

use staking_bridge::error::StakingBridgeErrorCode;

pub fn make_readonly_account_info<'a>(
    key: &'a Pubkey,
    lamports: &'a mut u64,
    data: &'a mut [u8],
    owner: &'a Pubkey,
) -> AccountInfo<'a> {
    let is_signer = false;
    let is_writable = false;
    let executable = false;
    let rent_epoch = 0;
    AccountInfo::new(
        key,
        is_signer,
        is_writable,
        lamports,
        data,
        owner,
        executable,
        rent_epoch,
    )
}

pub fn assert_error(
    res: Result<(), Error>,
    error: StakingBridgeErrorCode,
) {
    if res != Err(error.into()) {
        panic!("Expected {:?}, but got {:?}", error, res.unwrap_err());
    }
}
