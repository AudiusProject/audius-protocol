import json

from solders.rpc.responses import GetTransactionResp

# Notes about the transactions below to make things easier:
# - accountKeys[1] is the account which sent the money into payment router
# - For transactions where the sender is not a user bank, accountKeys[3] is the first recipient account. Values up to the "Tokenkeg..." account are all recipients
# - The "data" field in the memo transaction is a base58 encoded string consisting of either "recovery" or
#   <content_type>:<content_id>:<block_number_at_time_of_transaction>:<purchaser_user_id>.
# - `meta.preTokenBalances` and `meta.postTokenBalances` determine the amount paid
# for the content. The negative balance change in the "sending" account should match the sum of
# the positive balance changes in the "receiving" accounts. These can be modified
# to create new transactions with different value amounts. "Pay extra" is just a case
# where the total amount sent to the recipients is greater than the content price (
# defined by tracks using the TrackPriceHistory table, for example).
# New test cases that only need to differ in amounts and memo transaction metadata can
# be created by copying and modifying a transaction below, then giving it a new signature value.

# Routes $1.00 to a single recipient w/ memo for track purchase
mock_valid_track_purchase_single_recipient_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 190957,
                "transaction": {
                    "signatures": [
                        "5wPxiuLSF3MzXZt9XG99UEPNdxs8DtE2vWKezrB6zuMCrkMBJx6iU7xw5icaowpfgj96iLGnAgEAaBNSbneWdbZw"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 5,
                        },
                        "accountKeys": [
                            "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "3XmVeZ6M1FYDdUQaNeQZf8dipvtzNP6NVb5xjDkdeiNb",
                            "A76eNhRrfdy6WfMoQf4ALasMxzRWHajH4TrVuX2NUjZT",
                            "7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                            "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa",
                            "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                        ],
                        "recentBlockhash": "6D65tSU7pjSmFvSj9qK2W2bjkESw4XZebeNmgA1rCqnF",
                        "instructions": [
                            {
                                "programIdIndex": 4,
                                "accounts": [1, 5, 2, 0],
                                "data": "hYECWfYe8vYqs",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 6,
                                "accounts": [0],
                                # "track:1:1:2"
                                "data": "VsoUab4LQ4yax8R",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 7,
                                "accounts": [2, 8, 4, 3],
                                "data": "BQD4GnQPrhbq6Y9NJLnwDUziXhfF6BjkLYFbnKZH",
                                "stackHeight": None,
                            },
                        ],
                        "addressTableLookups": [],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 5000,
                    "preBalances": [
                        8420804160,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "postBalances": [
                        8420799160,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "innerInstructions": [
                        {
                            "index": 2,
                            "instructions": [
                                {
                                    "programIdIndex": 4,
                                    "accounts": [2, 3, 8, 8],
                                    "data": "3YKuzAsyicvj",
                                    "stackHeight": 2,
                                }
                            ],
                        }
                    ],
                    "logMessages": [
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
                        "Program log: Instruction: TransferChecked",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6173 of 600000 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 480 of 593827 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa invoke [1]",
                        "Program log: Instruction: Route",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 576902 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program log: All transfers complete!",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa consumed 21782 of 593347 compute units",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 10.0,
                                "decimals": 6,
                                "amount": "10000000",
                                "uiAmountString": "10.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 0,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 9.0,
                                "decimals": 6,
                                "amount": "9000000",
                                "uiAmountString": "9.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1.0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 28435,
                },
                "version": 0,
                "blockTime": 1701922096,
            },
            "id": 0,
        }
    )
)


# Routes $1.00 from a user bank to a single recipient w/ memo for track purchase
mock_valid_track_purchase_from_user_bank_single_recipient_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 26227,
                "transaction": {
                    "signatures": [
                        "4NgZHuZ1LNLRoJJi43B1iHbDKWwRhRnVKJJHYc2MPV5ArTkpc5sfcyd7Rgv5JZnXqEdSZdT9bpJ76myqHgCG2pfU"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 10,
                        },
                        "accountKeys": [
                            "HunCgdP91aVeoh8J7cbKTcFRoUwwhHwqYqVVLVkkqQjg",
                            # Sender user bank
                            "38YSndmPWVF3UdzczbB3UMYUgPQtZrgvvPVHa3M4yQVX",
                            "5B6jwaPf4mMdwyRjD9x7H9y8fFR5iwvZK64Ri3xkSXGh",
                            "A76eNhRrfdy6WfMoQf4ALasMxzRWHajH4TrVuX2NUjZT",
                            # Receiver user bank
                            "7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy",
                            "11111111111111111111111111111111",
                            "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa",
                            "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "KeccakSecp256k11111111111111111111111111111",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "Sysvar1nstructions1111111111111111111111111",
                            "SysvarRent111111111111111111111111111111111",
                            "testHKV1B56fbvop4w6f2cTGEub9dRQ2Euta5VmqdX9",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        ],
                        "recentBlockhash": "8CTRtyjoo275ZwHuq9nBEdYtTwG6jP7VxMwxv2yeiS76",
                        "instructions": [
                            {
                                "programIdIndex": 9,
                                "accounts": [],
                                "data": "H4eCheRWTZDTCFYXS5QxY3AH8Yb7NdpeFkwCufrAPtfgLzs1F3cLufX635zDuSDUdZkpWMrub9ppgfEWsDPiSBsxnP8oEboGFbQn8h7VeMoJqAtPhCHcBfPtcrKFzgrW1YY2HQ18wZCXK4e71NH5dWaqkKvUYCCq6jADEQP87zRpNzprDiTQUTWwPi7yed3MyuRzP",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 13,
                                "accounts": [0, 1, 3, 2, 6, 12, 11, 5, 14],
                                "data": "7PxDYbdhSHWR3DpxB6uwMyCTgjXC",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 7,
                                "accounts": [3, 8, 14, 4],
                                "data": "BQD4GnQPrhbq6Y9NJLgwWxBtNf2BL8pPGkJm9rAs",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 10,
                                "accounts": [0],
                                # "track:1:1:2"
                                "data": "VsoUab4LQ4yax8R",
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
                        19991459680,
                        2039280,
                        953520,
                        2039280,
                        2039280,
                        1,
                        0,
                        1141440,
                        946560,
                        1,
                        119712000,
                        0,
                        1009200,
                        1141440,
                        929020800,
                    ],
                    "postBalances": [
                        19991449680,
                        2039280,
                        953520,
                        2039280,
                        2039280,
                        1,
                        0,
                        1141440,
                        946560,
                        1,
                        119712000,
                        0,
                        1009200,
                        1141440,
                        929020800,
                    ],
                    "innerInstructions": [
                        {
                            "index": 1,
                            "instructions": [
                                {
                                    "programIdIndex": 14,
                                    "accounts": [1, 3, 6, 6],
                                    "data": "3QCwqmHZ4mdq",
                                    "stackHeight": 2,
                                }
                            ],
                        },
                        {
                            "index": 2,
                            "instructions": [
                                {
                                    "programIdIndex": 14,
                                    "accounts": [3, 4, 8, 8],
                                    "data": "3QCwqmHZ4mdq",
                                    "stackHeight": 2,
                                }
                            ],
                        },
                    ],
                    "logMessages": [
                        "Program testHKV1B56fbvop4w6f2cTGEub9dRQ2Euta5VmqdX9 invoke [1]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 777300 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program testHKV1B56fbvop4w6f2cTGEub9dRQ2Euta5VmqdX9 consumed 27936 of 800000 compute units",
                        "Program testHKV1B56fbvop4w6f2cTGEub9dRQ2Euta5VmqdX9 success",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa invoke [1]",
                        "Program log: Instruction: Route",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 755619 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program log: All transfers complete!",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa consumed 21782 of 772064 compute units",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa success",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 480 of 750282 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 7.0,
                                "decimals": 6,
                                "amount": "7000000",
                                "uiAmountString": "7",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 4,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 2.001,
                                "decimals": 6,
                                "amount": "2001000",
                                "uiAmountString": "2.001",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 6.0,
                                "decimals": 6,
                                "amount": "6000000",
                                "uiAmountString": "6",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 4,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 3.001,
                                "decimals": 6,
                                "amount": "3001000",
                                "uiAmountString": "3.001",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 50198,
                },
                "blockTime": 1701757366,
            },
            "id": 0,
        }
    )
)

# Routes $1.00 to a single recipient w/ NO memo for track purchase
mock_valid_transfer_without_purchase_single_recipient_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 190957,
                "transaction": {
                    "signatures": [
                        "5wPxiuLSF3MzXZt9XG99UEPNdxs8DtE2vWKezrB6zuMCrkMBJx6iU7xw5icaowpfgj96iLGnAgEAaBNSbneWdbZw"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 5,
                        },
                        "accountKeys": [
                            "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "3XmVeZ6M1FYDdUQaNeQZf8dipvtzNP6NVb5xjDkdeiNb",
                            "A76eNhRrfdy6WfMoQf4ALasMxzRWHajH4TrVuX2NUjZT",
                            "7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                            "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa",
                            "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                        ],
                        "recentBlockhash": "6D65tSU7pjSmFvSj9qK2W2bjkESw4XZebeNmgA1rCqnF",
                        "instructions": [
                            {
                                "programIdIndex": 4,
                                "accounts": [1, 5, 2, 0],
                                "data": "hYECWfYe8vYqs",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 7,
                                "accounts": [2, 8, 4, 3],
                                "data": "BQD4GnQPrhbq6Y9NJLnwDUziXhfF6BjkLYFbnKZH",
                                "stackHeight": None,
                            },
                        ],
                        "addressTableLookups": [],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 5000,
                    "preBalances": [
                        8420804160,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "postBalances": [
                        8420799160,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "innerInstructions": [
                        {
                            "index": 2,
                            "instructions": [
                                {
                                    "programIdIndex": 4,
                                    "accounts": [2, 3, 8, 8],
                                    "data": "3YKuzAsyicvj",
                                    "stackHeight": 2,
                                }
                            ],
                        }
                    ],
                    "logMessages": [
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
                        "Program log: Instruction: TransferChecked",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6173 of 600000 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa invoke [1]",
                        "Program log: Instruction: Route",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 576902 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program log: All transfers complete!",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa consumed 21782 of 593347 compute units",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 10.0,
                                "decimals": 6,
                                "amount": "10000000",
                                "uiAmountString": "10.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 0,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 9.0,
                                "decimals": 6,
                                "amount": "9000000",
                                "uiAmountString": "9.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1.0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 28435,
                },
                "version": 0,
                "blockTime": 1701922096,
            },
            "id": 0,
        }
    )
)

# Routes $1.00 from a user bank to a single recipient w/ NO memo for track purchase
mock_valid_transfer_from_user_bank_without_purchase_single_recipient_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 23952,
                "transaction": {
                    "signatures": [
                        "5w63hkGRYB95H7yuDTFxAw9json2EXVSNatQQ3444y3NHZPTQBT91G3iUeFXpPYyRouPdfDAeGTKa2oB4iDw8wHV"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 9,
                        },
                        "accountKeys": [
                            "HunCgdP91aVeoh8J7cbKTcFRoUwwhHwqYqVVLVkkqQjg",
                            # source user bank
                            "38YSndmPWVF3UdzczbB3UMYUgPQtZrgvvPVHa3M4yQVX",
                            "5B6jwaPf4mMdwyRjD9x7H9y8fFR5iwvZK64Ri3xkSXGh",
                            "A76eNhRrfdy6WfMoQf4ALasMxzRWHajH4TrVuX2NUjZT",
                            # recipient account
                            "7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy",
                            "11111111111111111111111111111111",
                            "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa",
                            "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "KeccakSecp256k11111111111111111111111111111",
                            "Sysvar1nstructions1111111111111111111111111",
                            "SysvarRent111111111111111111111111111111111",
                            "testHKV1B56fbvop4w6f2cTGEub9dRQ2Euta5VmqdX9",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        ],
                        "recentBlockhash": "8dq8k9h2yZk7nZomUzYYvAjVtFcux9sZEHa7te5mfFcv",
                        "instructions": [
                            {
                                "programIdIndex": 9,
                                "accounts": [],
                                "data": "H4eCheRWTZDTCFYXS5QxY3AH8Yb7NdpeFkwCufrAPtiDBtroMe2WhDEphzWPJ6ThwujM8Cmg8zQ8sKxubdGatUu43ej2kNSNdUm46dvwGUcVxAtJRbiYh96WDSFiiydXDABtLJYPZLkTaiJ72cUaNcBep18Cy6T9NTe3crrUGgEPwZ4wXCujYCakP7MLUJ2C22bno",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 12,
                                "accounts": [0, 1, 3, 2, 6, 11, 10, 5, 13],
                                "data": "7PxDYbdhSHWR3DpxB6uwMyCTgjXC",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 7,
                                "accounts": [3, 8, 13, 4],
                                "data": "BQD4GnQPrhbq6Y9NJLgwWxBtNf2BL8pPGkJm9rAs",
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
                        19991469680,
                        2039280,
                        953520,
                        2039280,
                        2039280,
                        1,
                        0,
                        1141440,
                        946560,
                        1,
                        0,
                        1009200,
                        1141440,
                        929020800,
                    ],
                    "postBalances": [
                        19991459680,
                        2039280,
                        953520,
                        2039280,
                        2039280,
                        1,
                        0,
                        1141440,
                        946560,
                        1,
                        0,
                        1009200,
                        1141440,
                        929020800,
                    ],
                    "innerInstructions": [
                        {
                            "index": 1,
                            "instructions": [
                                {
                                    "programIdIndex": 13,
                                    "accounts": [1, 3, 6, 6],
                                    "data": "3QCwqmHZ4mdq",
                                    "stackHeight": 2,
                                }
                            ],
                        },
                        {
                            "index": 2,
                            "instructions": [
                                {
                                    "programIdIndex": 13,
                                    "accounts": [3, 4, 8, 8],
                                    "data": "3QCwqmHZ4mdq",
                                    "stackHeight": 2,
                                }
                            ],
                        },
                    ],
                    "logMessages": [
                        "Program testHKV1B56fbvop4w6f2cTGEub9dRQ2Euta5VmqdX9 invoke [1]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 577300 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program testHKV1B56fbvop4w6f2cTGEub9dRQ2Euta5VmqdX9 consumed 27936 of 600000 compute units",
                        "Program testHKV1B56fbvop4w6f2cTGEub9dRQ2Euta5VmqdX9 success",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa invoke [1]",
                        "Program log: Instruction: Route",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 555619 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program log: All transfers complete!",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa consumed 21782 of 572064 compute units",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 8.0,
                                "decimals": 6,
                                "amount": "8000000",
                                "uiAmountString": "8",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 4,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 1.001,
                                "decimals": 6,
                                "amount": "1001000",
                                "uiAmountString": "1.001",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 7.0,
                                "decimals": 6,
                                "amount": "7000000",
                                "uiAmountString": "7",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 4,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 2.001,
                                "decimals": 6,
                                "amount": "2001000",
                                "uiAmountString": "2.001",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 49718,
                },
                "blockTime": 1701755091,
            },
            "id": 0,
        }
    )
)


# Routes $2.50 to a single recipient w/ memo for track purchase
mock_valid_track_purchase_single_recipient_pay_extra_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 190957,
                "transaction": {
                    "signatures": [
                        "3iWYPqQghhMRkTus28bUdFE8sNkvyARtcHh9Ct7gQm6cWNbn7YmyrbH4gtUVvSqNei3PBsFxzyo6HWcnpmvKmj3G"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 5,
                        },
                        "accountKeys": [
                            "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "3XmVeZ6M1FYDdUQaNeQZf8dipvtzNP6NVb5xjDkdeiNb",
                            "A76eNhRrfdy6WfMoQf4ALasMxzRWHajH4TrVuX2NUjZT",
                            "7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                            "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa",
                            "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                        ],
                        "recentBlockhash": "6D65tSU7pjSmFvSj9qK2W2bjkESw4XZebeNmgA1rCqnF",
                        "instructions": [
                            {
                                "programIdIndex": 4,
                                "accounts": [1, 5, 2, 0],
                                "data": "hYECWfYe8vYqs",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 6,
                                "accounts": [0],
                                # "track:1:1:2"
                                "data": "VsoUab4LQ4yax8R",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 7,
                                "accounts": [2, 8, 4, 3],
                                "data": "BQD4GnQPrhbq6Y9NJLnwDUziXhfF6BjkLYFbnKZH",
                                "stackHeight": None,
                            },
                        ],
                        "addressTableLookups": [],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 5000,
                    "preBalances": [
                        8420804160,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "postBalances": [
                        8420799160,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "innerInstructions": [
                        {
                            "index": 2,
                            "instructions": [
                                {
                                    "programIdIndex": 4,
                                    "accounts": [2, 3, 8, 8],
                                    "data": "3YKuzAsyicvj",
                                    "stackHeight": 2,
                                }
                            ],
                        }
                    ],
                    "logMessages": [
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
                        "Program log: Instruction: TransferChecked",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6173 of 600000 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 480 of 593827 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa invoke [1]",
                        "Program log: Instruction: Route",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 576902 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program log: All transfers complete!",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa consumed 21782 of 593347 compute units",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 10.0,
                                "decimals": 6,
                                "amount": "10000000",
                                "uiAmountString": "10.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 0,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 7.5,
                                "decimals": 6,
                                "amount": "7500000",
                                "uiAmountString": "7.5",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 2.5,
                                "decimals": 6,
                                "amount": "2500000",
                                "uiAmountString": "2.5",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 28435,
                },
                "version": 0,
                "blockTime": 1701922096,
            },
            "id": 0,
        }
    )
)


# Routes $1.00 to two different recipients w/ memo for track purchase
mock_valid_track_purchase_multi_recipient_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 190957,
                "transaction": {
                    "signatures": [
                        "5DScA4ktMTCsoJhgTo8tVQZjKXCuFubMnzNhT7YYjmyySYbgkWFGHmQwDrgWVxUngUE4Wg6kyR3hshq7BAvBuUcm"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 5,
                        },
                        "accountKeys": [
                            "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "3XmVeZ6M1FYDdUQaNeQZf8dipvtzNP6NVb5xjDkdeiNb",
                            "A76eNhRrfdy6WfMoQf4ALasMxzRWHajH4TrVuX2NUjZT",
                            "7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy",
                            "7dw7W4Yv7F1uWb9dVH1CFPm39mePyypuCji2zxcFA556",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                            "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa",
                            "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                        ],
                        "recentBlockhash": "6D65tSU7pjSmFvSj9qK2W2bjkESw4XZebeNmgA1rCqnF",
                        "instructions": [
                            {
                                "programIdIndex": 5,
                                "accounts": [1, 6, 2, 0],
                                "data": "hYECWfYe8vYqs",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 7,
                                "accounts": [0],
                                # "track:2:1:2"
                                "data": "VsoUab4LQBX7nGh",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 8,
                                "accounts": [2, 9, 5, 3, 4],
                                "data": "BQD4GnQPrhbq6Y9NJLnwDUziXhfF6BjkLYFbnKZH",
                                "stackHeight": None,
                            },
                        ],
                        "addressTableLookups": [],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 5000,
                    "preBalances": [
                        8420804160,
                        2039280,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "postBalances": [
                        8420799160,
                        2039280,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "innerInstructions": [
                        {
                            "index": 2,
                            "instructions": [
                                {
                                    "programIdIndex": 5,
                                    "accounts": [2, 3, 9, 9],
                                    "data": "3YKuzAsyicvj",
                                    "stackHeight": 2,
                                },
                                {
                                    "programIdIndex": 5,
                                    "accounts": [2, 4, 9, 9],
                                    "data": "3YKuzAsyicvj",
                                    "stackHeight": 2,
                                },
                            ],
                        }
                    ],
                    "logMessages": [
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
                        "Program log: Instruction: TransferChecked",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6173 of 600000 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 480 of 593827 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa invoke [1]",
                        "Program log: Instruction: Route",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 576902 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program log: All transfers complete!",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa consumed 21782 of 593347 compute units",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 10.0,
                                "decimals": 6,
                                "amount": "10000000",
                                "uiAmountString": "10.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 0,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 4,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 0,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "8xfR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd123",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 8.0,
                                "decimals": 6,
                                "amount": "8000000",
                                "uiAmountString": "8.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1.0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 4,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1.0",
                            },
                            "owner": "8xfR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd123",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 28435,
                },
                "version": 0,
                "blockTime": 1701922096,
            },
            "id": 0,
        }
    )
)

# Routes $1.00 to two different recipients w/ NO memo for track purchase
mock_valid_transfer_without_purchase_multi_recipient_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 190957,
                "transaction": {
                    "signatures": [
                        "5DScA4ktMTCsoJhgTo8tVQZjKXCuFubMnzNhT7YYjmyySYbgkWFGHmQwDrgWVxUngUE4Wg6kyR3hshq7BAvBuUcm"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 5,
                        },
                        "accountKeys": [
                            "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "3XmVeZ6M1FYDdUQaNeQZf8dipvtzNP6NVb5xjDkdeiNb",
                            "A76eNhRrfdy6WfMoQf4ALasMxzRWHajH4TrVuX2NUjZT",
                            "7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy",
                            "7dw7W4Yv7F1uWb9dVH1CFPm39mePyypuCji2zxcFA556",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                            "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa",
                            "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                        ],
                        "recentBlockhash": "6D65tSU7pjSmFvSj9qK2W2bjkESw4XZebeNmgA1rCqnF",
                        "instructions": [
                            {
                                "programIdIndex": 5,
                                "accounts": [1, 6, 2, 0],
                                "data": "hYECWfYe8vYqs",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 8,
                                "accounts": [2, 9, 5, 3, 4],
                                "data": "BQD4GnQPrhbq6Y9NJLnwDUziXhfF6BjkLYFbnKZH",
                                "stackHeight": None,
                            },
                        ],
                        "addressTableLookups": [],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 5000,
                    "preBalances": [
                        8420804160,
                        2039280,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "postBalances": [
                        8420799160,
                        2039280,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "innerInstructions": [
                        {
                            "index": 2,
                            "instructions": [
                                {
                                    "programIdIndex": 5,
                                    "accounts": [2, 3, 9, 9],
                                    "data": "3YKuzAsyicvj",
                                    "stackHeight": 2,
                                },
                                {
                                    "programIdIndex": 5,
                                    "accounts": [2, 4, 9, 9],
                                    "data": "3YKuzAsyicvj",
                                    "stackHeight": 2,
                                },
                            ],
                        }
                    ],
                    "logMessages": [
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
                        "Program log: Instruction: TransferChecked",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6173 of 600000 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa invoke [1]",
                        "Program log: Instruction: Route",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 576902 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program log: All transfers complete!",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa consumed 21782 of 593347 compute units",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 10.0,
                                "decimals": 6,
                                "amount": "10000000",
                                "uiAmountString": "10.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 0,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 4,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 0,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "8xfR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd123",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 8.0,
                                "decimals": 6,
                                "amount": "8000000",
                                "uiAmountString": "8.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1.0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 4,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1.0",
                            },
                            "owner": "8xfR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd123",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 28435,
                },
                "version": 0,
                "blockTime": 1701922096,
            },
            "id": 0,
        }
    )
)

# Routes $1.50 to one recipient, $2.00 to another w/ memo for track purchase
mock_valid_track_purchase_multi_recipient_pay_extra_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 190957,
                "transaction": {
                    "signatures": [
                        "5DScA4ktMTCsoJhgTo8tVQZjKXCuFubMnzNhT7YYjmyySYbgkWFGHmQwDrgWVxUngUE4Wg6kyR3hshq7BAvBuUcm"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 5,
                        },
                        "accountKeys": [
                            "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "3XmVeZ6M1FYDdUQaNeQZf8dipvtzNP6NVb5xjDkdeiNb",
                            "A76eNhRrfdy6WfMoQf4ALasMxzRWHajH4TrVuX2NUjZT",
                            "7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy",
                            "7dw7W4Yv7F1uWb9dVH1CFPm39mePyypuCji2zxcFA556",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                            "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa",
                            "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                        ],
                        "recentBlockhash": "6D65tSU7pjSmFvSj9qK2W2bjkESw4XZebeNmgA1rCqnF",
                        "instructions": [
                            {
                                "programIdIndex": 5,
                                "accounts": [1, 6, 2, 0],
                                "data": "hYECWfYe8vYqs",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 7,
                                "accounts": [0],
                                # "track:2:1:2"
                                "data": "VsoUab4LQBX7nGh",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 8,
                                "accounts": [2, 9, 5, 3, 4],
                                "data": "BQD4GnQPrhbq6Y9NJLnwDUziXhfF6BjkLYFbnKZH",
                                "stackHeight": None,
                            },
                        ],
                        "addressTableLookups": [],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 5000,
                    "preBalances": [
                        8420804160,
                        2039280,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "postBalances": [
                        8420799160,
                        2039280,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "innerInstructions": [
                        {
                            "index": 2,
                            "instructions": [
                                {
                                    "programIdIndex": 5,
                                    "accounts": [2, 3, 9, 9],
                                    "data": "3YKuzAsyicvj",
                                    "stackHeight": 2,
                                },
                                {
                                    "programIdIndex": 5,
                                    "accounts": [2, 4, 9, 9],
                                    "data": "3YKuzAsyicvj",
                                    "stackHeight": 2,
                                },
                            ],
                        }
                    ],
                    "logMessages": [
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
                        "Program log: Instruction: TransferChecked",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6173 of 600000 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 480 of 593827 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa invoke [1]",
                        "Program log: Instruction: Route",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 576902 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program log: All transfers complete!",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa consumed 21782 of 593347 compute units",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 10.0,
                                "decimals": 6,
                                "amount": "10000000",
                                "uiAmountString": "10.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 0,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 4,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 0,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "8xfR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd123",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 6.5,
                                "decimals": 6,
                                "amount": "6500000",
                                "uiAmountString": "6.5",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 1.5,
                                "decimals": 6,
                                "amount": "1500000",
                                "uiAmountString": "1.5",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 4,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 2.0,
                                "decimals": 6,
                                "amount": "2000000",
                                "uiAmountString": "2.0",
                            },
                            "owner": "8xfR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd123",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 28435,
                },
                "version": 0,
                "blockTime": 1701922096,
            },
            "id": 0,
        }
    )
)


# Routes $1.00 to one recipient and $0.50 to another w/ memo for track purchase
mock_invalid_track_purchase_insufficient_split_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 190957,
                "transaction": {
                    "signatures": [
                        "5DScA4ktMTCsoJhgTo8tVQZjKXCuFubMnzNhT7YYjmyySYbgkWFGHmQwDrgWVxUngUE4Wg6kyR3hshq7BAvBuUcm"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 5,
                        },
                        "accountKeys": [
                            "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "3XmVeZ6M1FYDdUQaNeQZf8dipvtzNP6NVb5xjDkdeiNb",
                            "A76eNhRrfdy6WfMoQf4ALasMxzRWHajH4TrVuX2NUjZT",
                            "7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy",
                            "7dw7W4Yv7F1uWb9dVH1CFPm39mePyypuCji2zxcFA556",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                            "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa",
                            "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                        ],
                        "recentBlockhash": "6D65tSU7pjSmFvSj9qK2W2bjkESw4XZebeNmgA1rCqnF",
                        "instructions": [
                            {
                                "programIdIndex": 5,
                                "accounts": [1, 6, 2, 0],
                                "data": "hYECWfYe8vYqs",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 7,
                                "accounts": [0],
                                # "track:2:1:2"
                                "data": "VsoUab4LQBX7nGh",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 8,
                                "accounts": [2, 9, 5, 3, 4],
                                "data": "BQD4GnQPrhbq6Y9NJLnwDUziXhfF6BjkLYFbnKZH",
                                "stackHeight": None,
                            },
                        ],
                        "addressTableLookups": [],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 5000,
                    "preBalances": [
                        8420804160,
                        2039280,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "postBalances": [
                        8420799160,
                        2039280,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "innerInstructions": [
                        {
                            "index": 2,
                            "instructions": [
                                {
                                    "programIdIndex": 5,
                                    "accounts": [2, 3, 9, 9],
                                    "data": "3YKuzAsyicvj",
                                    "stackHeight": 2,
                                },
                                {
                                    "programIdIndex": 5,
                                    "accounts": [2, 4, 9, 9],
                                    "data": "3YKuzAsyicvj",
                                    "stackHeight": 2,
                                },
                            ],
                        }
                    ],
                    "logMessages": [
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
                        "Program log: Instruction: TransferChecked",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6173 of 600000 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 480 of 593827 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa invoke [1]",
                        "Program log: Instruction: Route",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 576902 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program log: All transfers complete!",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa consumed 21782 of 593347 compute units",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 10.0,
                                "decimals": 6,
                                "amount": "10000000",
                                "uiAmountString": "10.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 0,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 4,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 0,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "8xfR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd123",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 8.5,
                                "decimals": 6,
                                "amount": "8500000",
                                "uiAmountString": "8.5",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1.0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 4,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 0.5,
                                "decimals": 6,
                                "amount": "500000",
                                "uiAmountString": "0.5",
                            },
                            "owner": "8xfR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd123",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 28435,
                },
                "version": 0,
                "blockTime": 1701922096,
            },
            "id": 0,
        }
    )
)

# Routes $2.00 to one recipient w/ memo for track purchase. Assumed that track
# is $2 but should be split evenly between two recipients.
mock_invalid_track_purchase_missing_split_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 190957,
                "transaction": {
                    "signatures": [
                        "5wPxiuLSF3MzXZt9XG99UEPNdxs8DtE2vWKezrB6zuMCrkMBJx6iU7xw5icaowpfgj96iLGnAgEAaBNSbneWdbZw"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 5,
                        },
                        "accountKeys": [
                            "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "3XmVeZ6M1FYDdUQaNeQZf8dipvtzNP6NVb5xjDkdeiNb",
                            "A76eNhRrfdy6WfMoQf4ALasMxzRWHajH4TrVuX2NUjZT",
                            "7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                            "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa",
                            "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                        ],
                        "recentBlockhash": "6D65tSU7pjSmFvSj9qK2W2bjkESw4XZebeNmgA1rCqnF",
                        "instructions": [
                            {
                                "programIdIndex": 4,
                                "accounts": [1, 5, 2, 0],
                                "data": "hYECWfYe8vYqs",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 6,
                                "accounts": [0],
                                # "track:2:1:2"
                                "data": "VsoUab4LQBX7nGh",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 7,
                                "accounts": [2, 8, 4, 3],
                                "data": "BQD4GnQPrhbq6Y9NJLnwDUziXhfF6BjkLYFbnKZH",
                                "stackHeight": None,
                            },
                        ],
                        "addressTableLookups": [],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 5000,
                    "preBalances": [
                        8420804160,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "postBalances": [
                        8420799160,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "innerInstructions": [
                        {
                            "index": 2,
                            "instructions": [
                                {
                                    "programIdIndex": 4,
                                    "accounts": [2, 3, 8, 8],
                                    "data": "3YKuzAsyicvj",
                                    "stackHeight": 2,
                                }
                            ],
                        }
                    ],
                    "logMessages": [
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
                        "Program log: Instruction: TransferChecked",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6173 of 600000 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 480 of 593827 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa invoke [1]",
                        "Program log: Instruction: Route",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 576902 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program log: All transfers complete!",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa consumed 21782 of 593347 compute units",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 10.0,
                                "decimals": 6,
                                "amount": "10000000",
                                "uiAmountString": "10.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 0,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 8,
                                "decimals": 6,
                                "amount": "8000000",
                                "uiAmountString": "8.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 2.0,
                                "decimals": 6,
                                "amount": "2000000",
                                "uiAmountString": "2.0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 28435,
                },
                "version": 0,
                "blockTime": 1701922096,
            },
            "id": 0,
        }
    )
)

# Failed attempt to Route $1.00 to a single recipient w/ memo for track purchase
mock_failed_track_purchase_single_recipient_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 190957,
                "transaction": {
                    "signatures": [
                        "5wPxiuLSF3MzXZt9XG99UEPNdxs8DtE2vWKezrB6zuMCrkMBJx6iU7xw5icaowpfgj96iLGnAgEAaBNSbneWdbZw"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 5,
                        },
                        "accountKeys": [
                            "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "3XmVeZ6M1FYDdUQaNeQZf8dipvtzNP6NVb5xjDkdeiNb",
                            "A76eNhRrfdy6WfMoQf4ALasMxzRWHajH4TrVuX2NUjZT",
                            "7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                            "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa",
                            "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                        ],
                        "recentBlockhash": "6D65tSU7pjSmFvSj9qK2W2bjkESw4XZebeNmgA1rCqnF",
                        "instructions": [
                            {
                                "programIdIndex": 4,
                                "accounts": [1, 5, 2, 0],
                                "data": "hYECWfYe8vYqs",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 6,
                                "accounts": [0],
                                # "track:1:1:2"
                                "data": "VsoUab4LQ4yax8R",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 7,
                                "accounts": [2, 8, 4, 3],
                                "data": "BQD4GnQPrhbq6Y9NJLnwDUziXhfF6BjkLYFbnKZH",
                                "stackHeight": None,
                            },
                        ],
                        "addressTableLookups": [],
                    },
                },
                "meta": {
                    "err": {"InstructionError": [0, {"Custom": 1}]},
                    "status": {"Err": {"InstructionError": [0, {"Custom": 1}]}},
                    "fee": 5000,
                    "preBalances": [
                        8420804160,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "postBalances": [
                        8420799160,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "innerInstructions": [
                        {
                            "index": 2,
                            "instructions": [
                                {
                                    "programIdIndex": 4,
                                    "accounts": [2, 3, 8, 8],
                                    "data": "3YKuzAsyicvj",
                                    "stackHeight": 2,
                                }
                            ],
                        }
                    ],
                    "logMessages": [
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
                        "Program log: Instruction: TransferChecked",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6173 of 600000 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 480 of 593827 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa invoke [1]",
                        "Program log: Instruction: Route",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 576902 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program log: All transfers complete!",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa consumed 21782 of 593347 compute units",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 10.0,
                                "decimals": 6,
                                "amount": "10000000",
                                "uiAmountString": "10.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 0,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 10.0,
                                "decimals": 6,
                                "amount": "10000000",
                                "uiAmountString": "10.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 00,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 28435,
                },
                "version": 0,
                "blockTime": 1701922096,
            },
            "id": 0,
        }
    )
)

# Transfer instruction for track purchase which reference payment router in the
# accounts, has a purchase content memo, and valid transfers but doesn't use a Route instruction
mock_non_route_transfer_purchase_single_recipient_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 190957,
                "transaction": {
                    "signatures": [
                        "5wPxiuLSF3MzXZt9XG99UEPNdxs8DtE2vWKezrB6zuMCrkMBJx6iU7xw5icaowpfgj96iLGnAgEAaBNSbneWdbZw"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 5,
                        },
                        "accountKeys": [
                            "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "3XmVeZ6M1FYDdUQaNeQZf8dipvtzNP6NVb5xjDkdeiNb",
                            "A76eNhRrfdy6WfMoQf4ALasMxzRWHajH4TrVuX2NUjZT",
                            "7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                            "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa",
                            "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "randomqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa",
                        ],
                        "recentBlockhash": "6D65tSU7pjSmFvSj9qK2W2bjkESw4XZebeNmgA1rCqnF",
                        "instructions": [
                            {
                                "programIdIndex": 4,
                                "accounts": [1, 5, 2, 0],
                                "data": "hYECWfYe8vYqs",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 6,
                                "accounts": [0],
                                # "track:1:1:2"
                                "data": "VsoUab4LQ4yax8R",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 9,
                                "accounts": [2, 8, 4, 3],
                                "data": "BQD4GnQPrhbq6Y9NJLnwDUziXhfF6BjkLYFbnKZH",
                                "stackHeight": None,
                            },
                        ],
                        "addressTableLookups": [],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 5000,
                    "preBalances": [
                        8420804160,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "postBalances": [
                        8420799160,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "innerInstructions": [
                        {
                            "index": 2,
                            "instructions": [
                                {
                                    "programIdIndex": 4,
                                    "accounts": [2, 3, 8, 8],
                                    "data": "3YKuzAsyicvj",
                                    "stackHeight": 2,
                                }
                            ],
                        }
                    ],
                    "logMessages": [
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
                        "Program log: Instruction: TransferChecked",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6173 of 600000 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 480 of 593827 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                        "Program randomqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa invoke [1]",
                        "Program log: Instruction: RandomThing",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 576902 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program log: All transfers complete!",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa consumed 21782 of 593347 compute units",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 10.0,
                                "decimals": 6,
                                "amount": "10000000",
                                "uiAmountString": "10.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 0,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 9.0,
                                "decimals": 6,
                                "amount": "9000000",
                                "uiAmountString": "9.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1.0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 28435,
                },
                "version": 0,
                "blockTime": 1701922096,
            },
            "id": 0,
        }
    )
)

# Routes $1.00 to a single recipient w/ memo for track purchase, but
# uses an unknown account as the source
mock_invalid_track_purchase_bad_PDA_account_single_recipient_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 190957,
                "transaction": {
                    "signatures": [
                        "5wPxiuLSF3MzXZt9XG99UEPNdxs8DtE2vWKezrB6zuMCrkMBJx6iU7xw5icaowpfgj96iLGnAgEAaBNSbneWdbZw"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 5,
                        },
                        "accountKeys": [
                            "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "3XmVeZ6M1FYDdUQaNeQZf8dipvtzNP6NVb5xjDkdeiNb",
                            "B76eNhRrfdy6WfMoQf4ALasMxzRWHajH4TrVuX2NUjZT",
                            "7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                            "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa",
                            "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                        ],
                        "recentBlockhash": "6D65tSU7pjSmFvSj9qK2W2bjkESw4XZebeNmgA1rCqnF",
                        "instructions": [
                            {
                                "programIdIndex": 4,
                                "accounts": [1, 5, 2, 0],
                                "data": "hYECWfYe8vYqs",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 6,
                                "accounts": [0],
                                # "track:1:1:2"
                                "data": "VsoUab4LQ4yax8R",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 7,
                                "accounts": [2, 8, 4, 3],
                                "data": "BQD4GnQPrhbq6Y9NJLnwDUziXhfF6BjkLYFbnKZH",
                                "stackHeight": None,
                            },
                        ],
                        "addressTableLookups": [],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 5000,
                    "preBalances": [
                        8420804160,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "postBalances": [
                        8420799160,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "innerInstructions": [
                        {
                            "index": 2,
                            "instructions": [
                                {
                                    "programIdIndex": 4,
                                    "accounts": [2, 3, 8, 8],
                                    "data": "3YKuzAsyicvj",
                                    "stackHeight": 2,
                                }
                            ],
                        }
                    ],
                    "logMessages": [
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
                        "Program log: Instruction: TransferChecked",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6173 of 600000 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 480 of 593827 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa invoke [1]",
                        "Program log: Instruction: Route",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 576902 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program log: All transfers complete!",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa consumed 21782 of 593347 compute units",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 10.0,
                                "decimals": 6,
                                "amount": "10000000",
                                "uiAmountString": "10.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 0,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 9.0,
                                "decimals": 6,
                                "amount": "9000000",
                                "uiAmountString": "9.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1.0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 28435,
                },
                "version": 0,
                "blockTime": 1701922096,
            },
            "id": 0,
        }
    )
)


# Routes $1.00 to a user bank w/ a recovery memo.
mock_valid_transfer_single_recipient_recovery_tx = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 190957,
                "transaction": {
                    "signatures": [
                        "5wPxiuLSF3MzXZt9XG99UEPNdxs8DtE2vWKezrB6zuMCrkMBJx6iU7xw5icaowpfgj96iLGnAgEAaBNSbneWdbZw"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 5,
                        },
                        "accountKeys": [
                            "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "3XmVeZ6M1FYDdUQaNeQZf8dipvtzNP6NVb5xjDkdeiNb",
                            "A76eNhRrfdy6WfMoQf4ALasMxzRWHajH4TrVuX2NUjZT",
                            "7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                            "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa",
                            "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                        ],
                        "recentBlockhash": "6D65tSU7pjSmFvSj9qK2W2bjkESw4XZebeNmgA1rCqnF",
                        "instructions": [
                            {
                                "programIdIndex": 4,
                                "accounts": [1, 5, 2, 0],
                                "data": "hYECWfYe8vYqs",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 6,
                                "accounts": [0],
                                # "Recover Withdrawal"
                                "data": "4RDcbHgG9pB3vm5rAKgbs5F47",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 7,
                                "accounts": [2, 8, 4, 3],
                                "data": "BQD4GnQPrhbq6Y9NJLnwDUziXhfF6BjkLYFbnKZH",
                                "stackHeight": None,
                            },
                        ],
                        "addressTableLookups": [],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 5000,
                    "preBalances": [
                        8420804160,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "postBalances": [
                        8420799160,
                        2039280,
                        2039280,
                        2039280,
                        929020800,
                        1461600,
                        119712000,
                        1141440,
                        946560,
                    ],
                    "innerInstructions": [
                        {
                            "index": 2,
                            "instructions": [
                                {
                                    "programIdIndex": 4,
                                    "accounts": [2, 3, 8, 8],
                                    "data": "3YKuzAsyicvj",
                                    "stackHeight": 2,
                                }
                            ],
                        }
                    ],
                    "logMessages": [
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
                        "Program log: Instruction: TransferChecked",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6173 of 600000 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 480 of 593827 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa invoke [1]",
                        "Program log: Instruction: Route",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4728 of 576902 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program log: All transfers complete!",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa consumed 21782 of 593347 compute units",
                        "Program apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 10.0,
                                "decimals": 6,
                                "amount": "10000000",
                                "uiAmountString": "10.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 0,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 9.0,
                                "decimals": 6,
                                "amount": "9000000",
                                "uiAmountString": "9.0",
                            },
                            "owner": "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "G231EZsMoCNBiQKP5quEeAM3oG516Zspirjnh7ywP71i",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y",
                            "uiTokenAmount": {
                                "uiAmount": 1.0,
                                "decimals": 6,
                                "amount": "1000000",
                                "uiAmountString": "1.0",
                            },
                            "owner": "7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                    "computeUnitsConsumed": 28435,
                },
                "version": 0,
                "blockTime": 1701922096,
            },
            "id": 0,
        }
    )
)
