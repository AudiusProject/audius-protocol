import json

from solders.transaction_status import UiTransactionStatusMeta

from src.utils.helpers import get_solana_tx_token_balance_changes

RECEIVER_ACCOUNT_INDEX = 1
SENDER_ACCOUNT_INDEX = 2


mock_meta = UiTransactionStatusMeta.from_json(
    json.dumps(
        {
            "status": {"Ok": None},
            "err": None,
            "fee": 5000,
            "logMessages": [
                "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 651 of 400000 compute units",
                "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
                "Program log: Instruction: TransferChecked",
                "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6172 of 399349 compute units",
                "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            ],
            "postBalances": [
                2935160,
                2039280,
                2039280,
                260042654,
                121159680,
                934087680,
            ],
            "postTokenBalances": [
                {
                    "accountIndex": 1,
                    "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                    "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    "uiTokenAmount": {
                        "amount": "5623032749",
                        "decimals": 8,
                        "uiAmount": 56.23032749,
                        "uiAmountString": "56.23032749",
                    },
                },
                {
                    "accountIndex": 2,
                    "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                    "owner": "GNkt1SGkdzvfaCYVpSKs7yjLxeyLJFKZv32cVYJ3GyHX",
                    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    "uiTokenAmount": {
                        "amount": "0",
                        "decimals": 8,
                        "uiAmount": None,
                        "uiAmountString": "0",
                    },
                },
            ],
            "preBalances": [2940160, 2039280, 2039280, 260042654, 121159680, 934087680],
            "preTokenBalances": [
                {
                    "accountIndex": 1,
                    "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                    "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    "uiTokenAmount": {
                        "amount": "500000000",
                        "decimals": 8,
                        "uiAmount": 5.0,
                        "uiAmountString": "5",
                    },
                },
                {
                    "accountIndex": 2,
                    "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                    "owner": "GNkt1SGkdzvfaCYVpSKs7yjLxeyLJFKZv32cVYJ3GyHX",
                    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    "uiTokenAmount": {
                        "amount": "5123032749",
                        "decimals": 8,
                        "uiAmount": 51.23032749,
                        "uiAmountString": "51.23032749",
                    },
                },
            ],
        },
    )
)


def test_get_solana_tx_token_balances():
    changes = get_solana_tx_token_balance_changes(
        meta=mock_meta, account_keys=["fake1", "fake2", "fake3"]
    )
    assert changes["fake2"]["pre_balance"] == 500000000
    assert changes["fake2"]["post_balance"] == 5623032749
    assert changes["fake2"]["change"] == 5123032749
