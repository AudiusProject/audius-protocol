import json

from solders.rpc.responses import GetTransactionResp

# Notes about the transactions below to make things easier:
# - accountKeys[1] is the sender account
# - accountKeys[3] is the recipient account.
# - The "data" field in the memo transaction is a base58 encoded string consisting of either
#   * <content_type>:<content_id>:<block_number_at_time_of_transaction>
#   * <content_type>:<content_id>:<block_number_at_time_of_transaction>:<purchaser_user_id>
# - `meta.preTokenBalances` and `meta.postTokenBalances` determine the amount transferred.
# The negative balance change in the "sending" account should match the sum of
# the positive balance changes in the "receiving" accounts. These can be modified
# to create new transactions with different value amounts. "Pay extra" is just a case
# where the total amount sent to the recipients is greater than the content price (
# defined by tracks using the TrackPriceHistory table, for example).
# New test cases that only need to differ in amounts and memo transaction metadata can
# be created by copying and modifying a transaction below. If you need to work with more
# than one transaction at a time in a test, you may need to change the signature.


MOCK_SIGNATURE = "3tD61jrsU4b6s7jMGR3hg7p9Dsm88NRR2RVgUUjdcHqfFf9JWRwyhPiRGvEqHnLN6qaoc1Gvqy9Nv2UyKcWe6u4C"

FEE_PAYER = "HmqRrgrZjR1Fkwgbv1nDXuUYQYs6ocGSzmGPoEUZqK1X"
USDC_MINT = "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y"
WAUDIO_MINT = "37RCjhgV1qGV2Q54EHFScdxZ22ydRMdKMtVgod47fDP3"

CLAIMABLE_TOKENS_PDA = "testHKV1B56fbvop4w6f2cTGEub9dRQ2Euta5VmqdX9"
UNKNOWN_PDA = "2HYsaffLbtDuMNNiUkvnQ1i9bHdMwtzEfB4win2bHkaj"

# Used as sender / purchaser in tracks below
SENDER_ACCOUNT_ADDRESS = "38YSndmPWVF3UdzczbB3UMYUgPQtZrgvvPVHa3M4yQVX"
# Used as recipient / track owner in transactions below
RECIPIENT_ACCOUNT_ADDRESS = "7G1angvMtUZLFMyrMDGj7bxsduB4bjLD7VXRR7N4FXqe"
EXTERNAL_ACCOUNT_ADDRESS = "7hxqJmiPkSAP1zbtu8w2gWXUzEvNp8u9Ms5pKcKwXiNn"
EXTERNAL_ACCOUNT_ADDRESS_OWNER = "8HLdEuB5K4TGa8txZQpjZcsgYf4PNdnft1ZeZobhP4Ug"
NONCE_ACCOUNT_ADDRESS = "ETHqyvd51HyoKtsgVdZTVH7c7Qw6dS6zpthqfGPtUsWk"

# The PDA accounts which own user banks in the transactions below need to be owned
# by the CLAIMABLE_TOKENS_PDA account. The addresses are derived using the PDA and
# mint addresses as input.

# Pubkey.find_program_address([bytes(WAUDIO_MINT)], Pubkey.from_string(CLAIMABLE_TOKENS_PDA))
WAUDIO_PDA = "8GrLc33SYDHaVKoXRLMau2yjYnMnSVg179qwJp9izeQb"


# Pubkey.find_program_address([bytes(USDC_MINT)], Pubkey.from_string(CLAIMABLE_TOKENS_PDA))
USDC_PDA = "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt"

# contentType:contentId:blockNumber
# base58.b58encode("track:1:10").decode("utf-8")
PURCHASE_TRACK1_MEMO_DATA = "7YSwHDhdZsHu6X"
# base58.b58encode("track:2:10").decode("utf-8")
PURCHASE_TRACK2_MEMO_DATA = "7YSwHDhdZtmtNs"

# contentType:contentId:blockNumber:purchaserUserId
# base58.b58encode("track:1:10:2").decode("utf-8")
PURCHASE_TRACK1_MEMO_DATA_WITH_PURCHASER_ID = "3CTE8jFKicpYknyXo"


# Purchase of track id 1 for $1 USDC
mock_valid_track_purchase_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 227246439,
                "transaction": {
                    "signatures": [MOCK_SIGNATURE],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 8,
                        },
                        "accountKeys": [
                            FEE_PAYER,
                            SENDER_ACCOUNT_ADDRESS,
                            NONCE_ACCOUNT_ADDRESS,
                            RECIPIENT_ACCOUNT_ADDRESS,
                            "11111111111111111111111111111111",
                            CLAIMABLE_TOKENS_PDA,
                            USDC_PDA,
                            "KeccakSecp256k11111111111111111111111111111",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "Sysvar1nstructions1111111111111111111111111",
                            "SysvarRent111111111111111111111111111111111",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        ],
                        "recentBlockhash": "5H434VMiHgK7RaJZaBKKcriu4eky8erb9QGfcHJSZquU",
                        "instructions": [
                            {
                                "programIdIndex": 7,
                                "accounts": [],
                                "data": "H4eCheRWTZDTCFYUcyMzE6EhQMZvvvLKJ9g6YaUpbZeoLLgVj1uvwCTdzcb2MzbKHsRjN8DjLYdqxuQEZe2TjUKCuBMrFtpnnLd4RcvBnr4ieHCdH8ZU1N6XDfiqyKB4zenQ9S4viza4ob4gbtmiRS6o6KGEtL3fJQRvaA3tdtSx1rfFogZzwMXAxHrkuxHrpAqfm",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 5,
                                "accounts": [0, 1, 3, 2, 6, 10, 9, 4, 11],
                                "data": "6dMrrkPeSzw2r5huQ6RToaJCaVuu",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 8,
                                "accounts": [0],
                                "data": PURCHASE_TRACK1_MEMO_DATA,
                                "stackHeight": None,
                            },
                        ],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 10000,
                    "preBalances": [
                        1689358166,
                        2039280,
                        953520,
                        2039280,
                        1,
                        1141440,
                        0,
                        1,
                        121159680,
                        0,
                        1009200,
                        934087680,
                    ],
                    "postBalances": [
                        1689348166,
                        2039280,
                        953520,
                        2039280,
                        1,
                        1141440,
                        0,
                        1,
                        121159680,
                        0,
                        1009200,
                        934087680,
                    ],
                    "innerInstructions": [
                        {
                            "index": 1,
                            "instructions": [
                                {
                                    "programIdIndex": 11,
                                    "accounts": [1, 3, 6, 6],
                                    "data": "3mhiKuxuaKy1",
                                    "stackHeight": 2,
                                }
                            ],
                        }
                    ],
                    "logMessages": [
                        f"Program {CLAIMABLE_TOKENS_PDA} invoke [1]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 581084 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        f"Program {CLAIMABLE_TOKENS_PDA} consumed 24149 of 600000 compute units",
                        f"Program {CLAIMABLE_TOKENS_PDA} success",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 588 of 575851 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 24737,
                },
                "blockTime": 1698802811,
            },
            "id": 0,
        }
    )
)

# Purchase of track id 1 for $2 USDC, assumes track is priced at $1
mock_valid_track_purchase_pay_extra_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 227246439,
                "transaction": {
                    "signatures": [MOCK_SIGNATURE],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 8,
                        },
                        "accountKeys": [
                            FEE_PAYER,
                            SENDER_ACCOUNT_ADDRESS,
                            NONCE_ACCOUNT_ADDRESS,
                            RECIPIENT_ACCOUNT_ADDRESS,
                            "11111111111111111111111111111111",
                            CLAIMABLE_TOKENS_PDA,
                            USDC_PDA,
                            "KeccakSecp256k11111111111111111111111111111",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "Sysvar1nstructions1111111111111111111111111",
                            "SysvarRent111111111111111111111111111111111",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        ],
                        "recentBlockhash": "5H434VMiHgK7RaJZaBKKcriu4eky8erb9QGfcHJSZquU",
                        "instructions": [
                            {
                                "programIdIndex": 7,
                                "accounts": [],
                                "data": "H4eCheRWTZDTCFYUcyMzE6EhQMZvvvLKJ9g6YaUpbZeoLLgVj1uvwCTdzcb2MzbKHsRjN8DjLYdqxuQEZe2TjUKCuBMrFtpnnLd4RcvBnr4ieHCdH8ZU1N6XDfiqyKB4zenQ9S4viza4ob4gbtmiRS6o6KGEtL3fJQRvaA3tdtSx1rfFogZzwMXAxHrkuxHrpAqfm",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 5,
                                "accounts": [0, 1, 3, 2, 6, 10, 9, 4, 11],
                                "data": "6dMrrkPeSzw2r5huQ6RToaJCaVuu",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 8,
                                "accounts": [0],
                                "data": PURCHASE_TRACK1_MEMO_DATA,
                                "stackHeight": None,
                            },
                        ],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 10000,
                    "preBalances": [
                        1689358166,
                        2039280,
                        953520,
                        2039280,
                        1,
                        1141440,
                        0,
                        1,
                        121159680,
                        0,
                        1009200,
                        934087680,
                    ],
                    "postBalances": [
                        1689348166,
                        2039280,
                        953520,
                        2039280,
                        1,
                        1141440,
                        0,
                        1,
                        121159680,
                        0,
                        1009200,
                        934087680,
                    ],
                    "innerInstructions": [
                        {
                            "index": 1,
                            "instructions": [
                                {
                                    "programIdIndex": 11,
                                    "accounts": [1, 3, 6, 6],
                                    "data": "3mhiKuxuaKy1",
                                    "stackHeight": 2,
                                }
                            ],
                        }
                    ],
                    "logMessages": [
                        f"Program {CLAIMABLE_TOKENS_PDA} invoke [1]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 581084 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        f"Program {CLAIMABLE_TOKENS_PDA} consumed 24149 of 600000 compute units",
                        f"Program {CLAIMABLE_TOKENS_PDA} success",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 588 of 575851 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": 2.0,
                                "decimals": 6,
                                "amount": "2000000",
                                "uiAmountString": "2",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": 2.0,
                                "decimals": 6,
                                "amount": "2000000",
                                "uiAmountString": "2",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 24737,
                },
                "blockTime": 1698802811,
            },
            "id": 0,
        }
    )
)


# Transfer $1 USDC between two user banks without a purchase
mock_valid_transfer_without_purchase_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 227246439,
                "transaction": {
                    "signatures": [MOCK_SIGNATURE],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 8,
                        },
                        "accountKeys": [
                            FEE_PAYER,
                            SENDER_ACCOUNT_ADDRESS,
                            NONCE_ACCOUNT_ADDRESS,
                            RECIPIENT_ACCOUNT_ADDRESS,
                            "11111111111111111111111111111111",
                            CLAIMABLE_TOKENS_PDA,
                            USDC_PDA,
                            "KeccakSecp256k11111111111111111111111111111",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "Sysvar1nstructions1111111111111111111111111",
                            "SysvarRent111111111111111111111111111111111",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        ],
                        "recentBlockhash": "5H434VMiHgK7RaJZaBKKcriu4eky8erb9QGfcHJSZquU",
                        "instructions": [
                            {
                                "programIdIndex": 7,
                                "accounts": [],
                                "data": "H4eCheRWTZDTCFYUcyMzE6EhQMZvvvLKJ9g6YaUpbZeoLLgVj1uvwCTdzcb2MzbKHsRjN8DjLYdqxuQEZe2TjUKCuBMrFtpnnLd4RcvBnr4ieHCdH8ZU1N6XDfiqyKB4zenQ9S4viza4ob4gbtmiRS6o6KGEtL3fJQRvaA3tdtSx1rfFogZzwMXAxHrkuxHrpAqfm",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 5,
                                "accounts": [0, 1, 3, 2, 6, 10, 9, 4, 11],
                                "data": "6dMrrkPeSzw2r5huQ6RToaJCaVuu",
                                "stackHeight": None,
                            },
                        ],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 10000,
                    "preBalances": [
                        1689358166,
                        2039280,
                        953520,
                        2039280,
                        1,
                        1141440,
                        0,
                        1,
                        121159680,
                        0,
                        1009200,
                        934087680,
                    ],
                    "postBalances": [
                        1689348166,
                        2039280,
                        953520,
                        2039280,
                        1,
                        1141440,
                        0,
                        1,
                        121159680,
                        0,
                        1009200,
                        934087680,
                    ],
                    "innerInstructions": [
                        {
                            "index": 1,
                            "instructions": [
                                {
                                    "programIdIndex": 11,
                                    "accounts": [1, 3, 6, 6],
                                    "data": "3mhiKuxuaKy1",
                                    "stackHeight": 2,
                                }
                            ],
                        }
                    ],
                    "logMessages": [
                        f"Program {CLAIMABLE_TOKENS_PDA} invoke [1]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 581084 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        f"Program {CLAIMABLE_TOKENS_PDA} consumed 24149 of 600000 compute units",
                        f"Program {CLAIMABLE_TOKENS_PDA} success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 24737,
                },
                "blockTime": 1698802811,
            },
            "id": 0,
        }
    )
)


# Purchase of track id 2 for $2 USDC with single recipient.
# It is assumed track id 2 has multiple splits so this will be an invalid purchase
mock_invalid_track_purchase_missing_splits_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 227246439,
                "transaction": {
                    "signatures": [MOCK_SIGNATURE],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 8,
                        },
                        "accountKeys": [
                            FEE_PAYER,
                            SENDER_ACCOUNT_ADDRESS,
                            NONCE_ACCOUNT_ADDRESS,
                            RECIPIENT_ACCOUNT_ADDRESS,
                            "11111111111111111111111111111111",
                            CLAIMABLE_TOKENS_PDA,
                            USDC_PDA,
                            "KeccakSecp256k11111111111111111111111111111",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "Sysvar1nstructions1111111111111111111111111",
                            "SysvarRent111111111111111111111111111111111",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        ],
                        "recentBlockhash": "5H434VMiHgK7RaJZaBKKcriu4eky8erb9QGfcHJSZquU",
                        "instructions": [
                            {
                                "programIdIndex": 7,
                                "accounts": [],
                                "data": "H4eCheRWTZDTCFYUcyMzE6EhQMZvvvLKJ9g6YaUpbZeoLLgVj1uvwCTdzcb2MzbKHsRjN8DjLYdqxuQEZe2TjUKCuBMrFtpnnLd4RcvBnr4ieHCdH8ZU1N6XDfiqyKB4zenQ9S4viza4ob4gbtmiRS6o6KGEtL3fJQRvaA3tdtSx1rfFogZzwMXAxHrkuxHrpAqfm",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 5,
                                "accounts": [0, 1, 3, 2, 6, 10, 9, 4, 11],
                                "data": "6dMrrkPeSzw2r5huQ6RToaJCaVuu",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 8,
                                "accounts": [0],
                                "data": PURCHASE_TRACK2_MEMO_DATA,
                                "stackHeight": None,
                            },
                        ],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 10000,
                    "preBalances": [
                        1689358166,
                        2039280,
                        953520,
                        2039280,
                        1,
                        1141440,
                        0,
                        1,
                        121159680,
                        0,
                        1009200,
                        934087680,
                    ],
                    "postBalances": [
                        1689348166,
                        2039280,
                        953520,
                        2039280,
                        1,
                        1141440,
                        0,
                        1,
                        121159680,
                        0,
                        1009200,
                        934087680,
                    ],
                    "innerInstructions": [
                        {
                            "index": 1,
                            "instructions": [
                                {
                                    "programIdIndex": 11,
                                    "accounts": [1, 3, 6, 6],
                                    "data": "3mhiKuxuaKy1",
                                    "stackHeight": 2,
                                }
                            ],
                        }
                    ],
                    "logMessages": [
                        f"Program {CLAIMABLE_TOKENS_PDA} invoke [1]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 581084 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        f"Program {CLAIMABLE_TOKENS_PDA} consumed 24149 of 600000 compute units",
                        f"Program {CLAIMABLE_TOKENS_PDA} success",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 588 of 575851 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": 2.0,
                                "decimals": 6,
                                "amount": "2000000",
                                "uiAmountString": "2",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": 2.0,
                                "decimals": 6,
                                "amount": "2000000",
                                "uiAmountString": "2",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 24737,
                },
                "blockTime": 1698802811,
            },
            "id": 0,
        }
    )
)

# Purchases Track id 2 for $2 USDC. Transfers 1.50 to one recipient and 0.50 to another
# Assumes that it should be an even split.
mock_invalid_track_purchase_bad_splits_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 227246439,
                "transaction": {
                    "signatures": [MOCK_SIGNATURE],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 8,
                        },
                        "accountKeys": [
                            FEE_PAYER,
                            SENDER_ACCOUNT_ADDRESS,
                            NONCE_ACCOUNT_ADDRESS,
                            RECIPIENT_ACCOUNT_ADDRESS,
                            EXTERNAL_ACCOUNT_ADDRESS,
                            "11111111111111111111111111111111",
                            CLAIMABLE_TOKENS_PDA,
                            USDC_PDA,
                            "KeccakSecp256k11111111111111111111111111111",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "Sysvar1nstructions1111111111111111111111111",
                            "SysvarRent111111111111111111111111111111111",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        ],
                        "recentBlockhash": "5H434VMiHgK7RaJZaBKKcriu4eky8erb9QGfcHJSZquU",
                        "instructions": [
                            {
                                "programIdIndex": 8,
                                "accounts": [],
                                "data": "H4eCheRWTZDTCFYUcyMzE6EhQMZvvvLKJ9g6YaUpbZeoLLgVj1uvwCTdzcb2MzbKHsRjN8DjLYdqxuQEZe2TjUKCuBMrFtpnnLd4RcvBnr4ieHCdH8ZU1N6XDfiqyKB4zenQ9S4viza4ob4gbtmiRS6o6KGEtL3fJQRvaA3tdtSx1rfFogZzwMXAxHrkuxHrpAqfm",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 6,
                                "accounts": [0, 1, 3, 2, 7, 11, 10, 5, 12],
                                "data": "6dMrrkPeSzw2r5huQ6RToaJCaVuu",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 9,
                                "accounts": [0],
                                "data": PURCHASE_TRACK2_MEMO_DATA,
                                "stackHeight": None,
                            },
                        ],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 10000,
                    "preBalances": [
                        1689358166,
                        2039280,
                        953520,
                        2039280,
                        2039280,
                        1,
                        1141440,
                        0,
                        1,
                        121159680,
                        0,
                        1009200,
                        934087680,
                    ],
                    "postBalances": [
                        1689348166,
                        2039280,
                        953520,
                        2039280,
                        2039280,
                        1,
                        1141440,
                        0,
                        1,
                        121159680,
                        0,
                        1009200,
                        934087680,
                    ],
                    "innerInstructions": [
                        {
                            "index": 1,
                            "instructions": [
                                {
                                    "programIdIndex": 12,
                                    "accounts": [1, 3, 7, 7],
                                    "data": "3mhiKuxuaKy1",
                                    "stackHeight": 2,
                                }
                            ],
                        },
                        {
                            "index": 2,
                            "instructions": [
                                {
                                    "programIdIndex": 12,
                                    "accounts": [1, 4, 7, 7],
                                    "data": "3mhiKuxuaKy1",
                                    "stackHeight": 2,
                                }
                            ],
                        },
                    ],
                    "logMessages": [
                        f"Program {CLAIMABLE_TOKENS_PDA} invoke [1]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 581084 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        f"Program {CLAIMABLE_TOKENS_PDA} consumed 24149 of 600000 compute units",
                        f"Program {CLAIMABLE_TOKENS_PDA} success",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        f"Program {CLAIMABLE_TOKENS_PDA} consumed 24149 of 600000 compute units",
                        f"Program {CLAIMABLE_TOKENS_PDA} success",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 588 of 575851 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": 2.0,
                                "decimals": 6,
                                "amount": "2000000",
                                "uiAmountString": "2",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 4,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": EXTERNAL_ACCOUNT_ADDRESS_OWNER,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": 1.5,
                                "decimals": 6,
                                "amount": "1500000",
                                "uiAmountString": "1.5",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 4,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": 0.5,
                                "decimals": 6,
                                "amount": "500000",
                                "uiAmountString": "0.5",
                            },
                            "owner": EXTERNAL_ACCOUNT_ADDRESS_OWNER,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 24737,
                },
                "blockTime": 1698802811,
            },
            "id": 0,
        }
    )
)

mock_failed_track_purchase_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 227246439,
                "transaction": {
                    "signatures": [MOCK_SIGNATURE],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 8,
                        },
                        "accountKeys": [
                            FEE_PAYER,
                            SENDER_ACCOUNT_ADDRESS,
                            NONCE_ACCOUNT_ADDRESS,
                            RECIPIENT_ACCOUNT_ADDRESS,
                            "11111111111111111111111111111111",
                            CLAIMABLE_TOKENS_PDA,
                            USDC_PDA,
                            "KeccakSecp256k11111111111111111111111111111",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "Sysvar1nstructions1111111111111111111111111",
                            "SysvarRent111111111111111111111111111111111",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        ],
                        "recentBlockhash": "5H434VMiHgK7RaJZaBKKcriu4eky8erb9QGfcHJSZquU",
                        "instructions": [
                            {
                                "programIdIndex": 7,
                                "accounts": [],
                                "data": "H4eCheRWTZDTCFYUcyMzE6EhQMZvvvLKJ9g6YaUpbZeoLLgVj1uvwCTdzcb2MzbKHsRjN8DjLYdqxuQEZe2TjUKCuBMrFtpnnLd4RcvBnr4ieHCdH8ZU1N6XDfiqyKB4zenQ9S4viza4ob4gbtmiRS6o6KGEtL3fJQRvaA3tdtSx1rfFogZzwMXAxHrkuxHrpAqfm",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 5,
                                "accounts": [0, 1, 3, 2, 6, 10, 9, 4, 11],
                                "data": "6dMrrkPeSzw2r5huQ6RToaJCaVuu",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 8,
                                "accounts": [0],
                                "data": PURCHASE_TRACK1_MEMO_DATA,
                                "stackHeight": None,
                            },
                        ],
                    },
                },
                "meta": {
                    "err": {"InstructionError": [0, {"Custom": 1}]},
                    "status": {"Err": {"InstructionError": [0, {"Custom": 1}]}},
                    "fee": 10000,
                    "preBalances": [
                        1689358166,
                        2039280,
                        953520,
                        2039280,
                        1,
                        1141440,
                        0,
                        1,
                        121159680,
                        0,
                        1009200,
                        934087680,
                    ],
                    "postBalances": [
                        1689348166,
                        2039280,
                        953520,
                        2039280,
                        1,
                        1141440,
                        0,
                        1,
                        121159680,
                        0,
                        1009200,
                        934087680,
                    ],
                    "innerInstructions": [
                        {
                            "index": 1,
                            "instructions": [
                                {
                                    "programIdIndex": 11,
                                    "accounts": [1, 3, 6, 6],
                                    "data": "3mhiKuxuaKy1",
                                    "stackHeight": 2,
                                }
                            ],
                        }
                    ],
                    "logMessages": [
                        f"Program {CLAIMABLE_TOKENS_PDA} invoke [1]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 581084 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        f"Program {CLAIMABLE_TOKENS_PDA} consumed 24149 of 600000 compute units",
                        f"Program {CLAIMABLE_TOKENS_PDA} success",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 588 of 575851 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 24737,
                },
                "blockTime": 1698802811,
            },
            "id": 0,
        }
    )
)

# Purchase of track id 1 for $1 USDC using an unknown PDA
mock_invalid_track_purchase_unknown_pda_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 227246439,
                "transaction": {
                    "signatures": [MOCK_SIGNATURE],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 8,
                        },
                        "accountKeys": [
                            FEE_PAYER,
                            SENDER_ACCOUNT_ADDRESS,
                            NONCE_ACCOUNT_ADDRESS,
                            RECIPIENT_ACCOUNT_ADDRESS,
                            "11111111111111111111111111111111",
                            CLAIMABLE_TOKENS_PDA,
                            UNKNOWN_PDA,
                            "KeccakSecp256k11111111111111111111111111111",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "Sysvar1nstructions1111111111111111111111111",
                            "SysvarRent111111111111111111111111111111111",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        ],
                        "recentBlockhash": "5H434VMiHgK7RaJZaBKKcriu4eky8erb9QGfcHJSZquU",
                        "instructions": [
                            {
                                "programIdIndex": 7,
                                "accounts": [],
                                "data": "H4eCheRWTZDTCFYUcyMzE6EhQMZvvvLKJ9g6YaUpbZeoLLgVj1uvwCTdzcb2MzbKHsRjN8DjLYdqxuQEZe2TjUKCuBMrFtpnnLd4RcvBnr4ieHCdH8ZU1N6XDfiqyKB4zenQ9S4viza4ob4gbtmiRS6o6KGEtL3fJQRvaA3tdtSx1rfFogZzwMXAxHrkuxHrpAqfm",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 5,
                                "accounts": [0, 1, 3, 2, 6, 10, 9, 4, 11],
                                "data": "6dMrrkPeSzw2r5huQ6RToaJCaVuu",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 8,
                                "accounts": [0],
                                "data": PURCHASE_TRACK1_MEMO_DATA,
                                "stackHeight": None,
                            },
                        ],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 10000,
                    "preBalances": [
                        1689358166,
                        2039280,
                        953520,
                        2039280,
                        1,
                        1141440,
                        0,
                        1,
                        121159680,
                        0,
                        1009200,
                        934087680,
                    ],
                    "postBalances": [
                        1689348166,
                        2039280,
                        953520,
                        2039280,
                        1,
                        1141440,
                        0,
                        1,
                        121159680,
                        0,
                        1009200,
                        934087680,
                    ],
                    "innerInstructions": [
                        {
                            "index": 1,
                            "instructions": [
                                {
                                    "programIdIndex": 11,
                                    "accounts": [1, 3, 6, 6],
                                    "data": "3mhiKuxuaKy1",
                                    "stackHeight": 2,
                                }
                            ],
                        }
                    ],
                    "logMessages": [
                        f"Program {CLAIMABLE_TOKENS_PDA} invoke [1]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 581084 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        f"Program {CLAIMABLE_TOKENS_PDA} consumed 24149 of 600000 compute units",
                        f"Program {CLAIMABLE_TOKENS_PDA} success",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 588 of 575851 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1",
                            },
                            "owner": UNKNOWN_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": UNKNOWN_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": UNKNOWN_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1",
                            },
                            "owner": UNKNOWN_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 24737,
                },
                "blockTime": 1698802811,
            },
            "id": 0,
        }
    )
)

# Create token account for userbank address 7G1angvMtUZLFMyrMDGj7bxsduB4bjLD7VXRR7N4FXqe
# and eth address 0xe66402f9a6714a874a539fb1689b870dd271dfb2
mock_valid_create_token_account_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 1039,
                "transaction": {
                    "signatures": [
                        "61h4M3EjVAZ9caw37ygLKpiAdGpsbjTESmrT2zSDBAd19hM3i49DWbQRza5PG3coX2raaaqPKckd5LrRS7h5BiZp"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 6,
                        },
                        "accountKeys": [
                            FEE_PAYER,
                            RECIPIENT_ACCOUNT_ADDRESS,
                            "11111111111111111111111111111111",
                            USDC_MINT,
                            USDC_PDA,
                            "SysvarRent111111111111111111111111111111111",
                            CLAIMABLE_TOKENS_PDA,
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        ],
                        "recentBlockhash": "G49zpD1xEJvjeWNDFwRbCrwYp8rH3dKgfvkcZnpubYMW",
                        "instructions": [
                            {
                                "programIdIndex": 6,
                                "accounts": [0, 3, 4, 1, 5, 7, 2],
                                "data": "14DAXhVVokSE25ZP5P4DToK4ts3zZ",
                                "stackHeight": None,
                            }
                        ],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 5000,
                    "preBalances": [19998586040, 0, 1, 1461600, 0, 1009200, 1141440, 1],
                    "postBalances": [
                        19996541760,
                        2039280,
                        1,
                        1461600,
                        0,
                        1009200,
                        1141440,
                        1,
                    ],
                    "innerInstructions": [
                        {
                            "index": 0,
                            "instructions": [
                                {
                                    "programIdIndex": 2,
                                    "accounts": [0, 1, 4],
                                    "data": "R7r7mzYUyce18QDjGswhPZMQ5y7Q58eHcPYaiaAZsGS68TQJgcprBhcjbzoKQiTs4cCNsbjYTrxanQ32T8WPN2am1EN3hNK4VamjnXvqQUezUzTxYFDCkA3tuXbHyBKmooGc7sdQpNfhgWmQhcCL1wvCuBoqiQQo6tg",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 7,
                                    "accounts": [1, 3, 4, 5],
                                    "data": "2",
                                    "stackHeight": None,
                                },
                            ],
                        }
                    ],
                    "logMessages": [
                        f"Program {CLAIMABLE_TOKENS_PDA} invoke [1]",
                        "Program log: Instruction: CreateTokenAccount",
                        "Program 11111111111111111111111111111111 invoke [2]",
                        "Program 11111111111111111111111111111111 success",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: InitializeAccount",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3602 of 1382448 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        f"Program {CLAIMABLE_TOKENS_PDA} consumed 21499 of 1400000 compute units",
                        f"Program {CLAIMABLE_TOKENS_PDA} success",
                    ],
                    "preTokenBalances": [],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": USDC_PDA,
                        }
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                },
                "blockTime": 1689354934,
            },
            "id": 0,
        }
    )
)

# Appears to be a purchase, but doesn't use a recognized instruction
mock_unknown_instruction_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 227246439,
                "transaction": {
                    "signatures": [MOCK_SIGNATURE],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 8,
                        },
                        "accountKeys": [
                            FEE_PAYER,
                            SENDER_ACCOUNT_ADDRESS,
                            NONCE_ACCOUNT_ADDRESS,
                            RECIPIENT_ACCOUNT_ADDRESS,
                            "11111111111111111111111111111111",
                            CLAIMABLE_TOKENS_PDA,
                            USDC_PDA,
                            "KeccakSecp256k11111111111111111111111111111",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "Sysvar1nstructions1111111111111111111111111",
                            "SysvarRent111111111111111111111111111111111",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        ],
                        "recentBlockhash": "5H434VMiHgK7RaJZaBKKcriu4eky8erb9QGfcHJSZquU",
                        "instructions": [
                            {
                                "programIdIndex": 7,
                                "accounts": [],
                                "data": "H4eCheRWTZDTCFYUcyMzE6EhQMZvvvLKJ9g6YaUpbZeoLLgVj1uvwCTdzcb2MzbKHsRjN8DjLYdqxuQEZe2TjUKCuBMrFtpnnLd4RcvBnr4ieHCdH8ZU1N6XDfiqyKB4zenQ9S4viza4ob4gbtmiRS6o6KGEtL3fJQRvaA3tdtSx1rfFogZzwMXAxHrkuxHrpAqfm",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 5,
                                "accounts": [0, 1, 3, 2, 6, 10, 9, 4, 11],
                                "data": "6dMrrkPeSzw2r5huQ6RToaJCaVuu",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 8,
                                "accounts": [0],
                                "data": PURCHASE_TRACK1_MEMO_DATA,
                                "stackHeight": None,
                            },
                        ],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 10000,
                    "preBalances": [
                        1689358166,
                        2039280,
                        953520,
                        2039280,
                        1,
                        1141440,
                        0,
                        1,
                        121159680,
                        0,
                        1009200,
                        934087680,
                    ],
                    "postBalances": [
                        1689348166,
                        2039280,
                        953520,
                        2039280,
                        1,
                        1141440,
                        0,
                        1,
                        121159680,
                        0,
                        1009200,
                        934087680,
                    ],
                    "innerInstructions": [
                        {
                            "index": 1,
                            "instructions": [
                                {
                                    "programIdIndex": 11,
                                    "accounts": [1, 3, 6, 6],
                                    "data": "3mhiKuxuaKy1",
                                    "stackHeight": 2,
                                }
                            ],
                        }
                    ],
                    "logMessages": [
                        f"Program {CLAIMABLE_TOKENS_PDA} invoke [1]",
                        "Program log: Instruction: RandomThing",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: RandomThing",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 581084 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        f"Program {CLAIMABLE_TOKENS_PDA} consumed 24149 of 600000 compute units",
                        f"Program {CLAIMABLE_TOKENS_PDA} success",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 588 of 575851 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": USDC_MINT,
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1",
                            },
                            "owner": USDC_PDA,
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 24737,
                },
                "blockTime": 1698802811,
            },
            "id": 0,
        }
    )
)
