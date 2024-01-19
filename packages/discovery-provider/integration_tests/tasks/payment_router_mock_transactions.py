import json

from solders.rpc.responses import GetTransactionResp

# Notes about the transactions below to make things easier:
# - accountKeys[1] is the account which sent the money into payment router
# - accountKeys[3] is the first recipient account. Values up to the "Tokenkeg..." account are all recipients
# - The "data" field in the memo transaction is a base58 encoded string consisting of
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
                            # User bank as source address
                            "38YSndmPWVF3UdzczbB3UMYUgPQtZrgvvPVHa3M4yQVX",
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
                            # User bank as source address
                            "38YSndmPWVF3UdzczbB3UMYUgPQtZrgvvPVHa3M4yQVX",
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


# Routes $1.00 to a single recipient w/ a recovery memo that does not specify
# a source transaction. The sending address should match the recipient of a previous
# transaction in order to trigger recovery
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
                                # "recovery"
                                "data": "L8nXdrNsKha",
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
