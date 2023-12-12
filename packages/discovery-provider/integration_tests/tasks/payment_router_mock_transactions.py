import json
from unittest.mock import create_autospec, patch

from solders.rpc.responses import (
    GetTransactionResp,
    RpcConfirmedTransactionStatusWithSignature,
)


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
                                "uiAmount": 99999988.24794,
                                "decimals": 6,
                                "amount": "99999988247940",
                                "uiAmountString": "99999988.24794",
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
                                "uiAmount": 11.75106,
                                "decimals": 6,
                                "amount": "11751060",
                                "uiAmountString": "11.75106",
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
                                "uiAmount": 99999986.09794,
                                "decimals": 6,
                                "amount": "99999986097940",
                                "uiAmountString": "99999986.09794",
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
                                "uiAmount": 13.90106,
                                "decimals": 6,
                                "amount": "13901060",
                                "uiAmountString": "13.90106",
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
