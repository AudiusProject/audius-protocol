from unittest import mock

import pytest
from solders.rpc.responses import GetTransactionResp

from src.solana.solana_client_manager import SolanaClientManager

solana_client_manager = SolanaClientManager(
    "https://audius.rpcpool.com,https://api.mainnet-beta.solana.com,https://solana-api.projectserum.com"
)

example_response = GetTransactionResp.from_json(
    """
{"jsonrpc":"2.0","result":{"slot":207254272,"transaction":{"signatures":["564oju8DrSrWd9sSjhgDEFxSYQ1TyAR1dStAwbr5WS6kaLT2GHxt5NVwbdm9cE79ovaGyMu8ZgXUBB9EC8F2XT8J"],"message":{"header":{"numRequiredSignatures":1,"numReadonlySignedAccounts":0,"numReadonlyUnsignedAccounts":6},"accountKeys":["JsP7ivVoNhQZXMDmQd5m6VP6mYmycdCFHzK3i2jAmT9","AqxuSwjrQP2RFjdDTpe68fQnE3ei8xBjtBHxeW9RXpTe","11111111111111111111111111111111","5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx","9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM","Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ","SysvarRent111111111111111111111111111111111","TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"],"recentBlockhash":"3NGCi2ToZdrvLFKMhDneWBajtdLhhwnxvNqfWeNkBJ6u","instructions":[{"programIdIndex":5,"accounts":[0,4,3,1,6,7,2],"data":"12nbV5RC3kfWbXA2XRTymwPLfZ76r","stackHeight":null}]}},"meta":{"err":null,"status":{"Ok":null},"fee":5000,"preBalances":[3474085841,0,1,11030000,260042654,1141440,1009200,934087680],"postBalances":[3472041561,2039280,1,11030000,260042654,1141440,1009200,934087680],"innerInstructions":[{"index":0,"instructions":[{"programIdIndex":2,"accounts":[0,1,3],"data":"R7r7mFYpVnfogxGmgKgoouv7CPupJtRDwQVv3vdrK5Jc6WMMKQSCJRVvFjiJTrk9J5f2mXKuYyYtcsrdndPbHXFYPa93hm28j9kRF94eVq98TSrY89AZS6h5hfnTwZEEwR2gB2rnhF6jfuGdvzFzB1VbbEqzbzEXESC","stackHeight":null},{"programIdIndex":7,"accounts":[1,4,3,6],"data":"2","stackHeight":null}]}],"logMessages":["Program Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ invoke [1]","Program log: Instruction: CreateTokenAccount","Program 11111111111111111111111111111111 invoke [2]","Program 11111111111111111111111111111111 success","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]","Program log: Instruction: InitializeAccount","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4501 of 178292 compute units","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success","Program Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ consumed 26870 of 200000 compute units","Program Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ success"],"preTokenBalances":[],"postTokenBalances":[{"accountIndex":1,"mint":"9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM","uiTokenAmount":{"uiAmount":null,"decimals":8,"amount":"0","uiAmountString":"0"},"owner":"5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"}],"rewards":[],"loadedAddresses":{"writable":[],"readonly":[]},"computeUnitsConsumed":26870},"blockTime":1690212068},"id":0}
"""
)


@mock.patch("solana.rpc.api.Client")
def test_get_client(_):
    # test exception raised if no clients
    with pytest.raises(Exception):
        solana_client_manager.clients = []
        solana_client_manager.get_client()

    client_mocks = [
        mock.Mock(name="first"),
        mock.Mock(name="second"),
        mock.Mock(name="third"),
    ]
    solana_client_manager.clients = client_mocks

    # test that get client returns first one
    assert solana_client_manager.get_client() == client_mocks[0]

    # test that get random client will sometimes return other clients
    num_random_iterations = 10
    # very unlikely that 10 calls to get random client all return the first one
    returned_other_client = False
    for _ in range(num_random_iterations):
        client = solana_client_manager.get_client(randomize=True)
        if client != client_mocks[0]:
            returned_other_client = True
            break
    assert returned_other_client == True


@mock.patch("solana.rpc.api.Client")
def test_get_sol_tx_info(_):
    client_mocks = [
        mock.Mock(name="first"),
        mock.Mock(name="second"),
        mock.Mock(name="third"),
    ]
    solana_client_manager.clients = client_mocks

    expected_response = example_response

    # test that it returns the client call response
    client_mocks[0].get_transaction.return_value = expected_response
    assert (
        solana_client_manager.get_sol_tx_info(
            "564oju8DrSrWd9sSjhgDEFxSYQ1TyAR1dStAwbr5WS6kaLT2GHxt5NVwbdm9cE79ovaGyMu8ZgXUBB9EC8F2XT8J"
        )
        == expected_response
    )

    # test that it retries the same client before moving on to subsequent clients
    # also test that it will try subsequent clients if first one fails
    client_mocks[0].reset_mock()
    client_mocks[1].reset_mock()
    client_mocks[2].reset_mock()

    num_retries = 2
    client_mocks[0].get_transaction.side_effect = Exception()
    client_mocks[1].get_transaction.side_effect = Exception()
    client_mocks[2].get_transaction.return_value = expected_response
    assert (
        solana_client_manager.get_sol_tx_info(
            "564oju8DrSrWd9sSjhgDEFxSYQ1TyAR1dStAwbr5WS6kaLT2GHxt5NVwbdm9cE79ovaGyMu8ZgXUBB9EC8F2XT8J",
            num_retries,
        )
        == expected_response
    )
    assert client_mocks[0].get_transaction.call_count == 2
    assert client_mocks[1].get_transaction.call_count == 2
    assert client_mocks[2].get_transaction.call_count == 1


@mock.patch("solana.rpc.api.Client")
def test_get_signatures_for_address(_):
    client_mocks = [
        mock.Mock(name="first"),
        mock.Mock(name="second"),
        mock.Mock(name="third"),
    ]
    solana_client_manager.clients = client_mocks

    expected_response = example_response

    # test that it returns the client call response
    client_mocks[0].get_signatures_for_address.return_value = expected_response
    assert (
        solana_client_manager.get_signatures_for_address(
            "JsP7ivVoNhQZXMDmQd5m6VP6mYmycdCFHzK3i2jAmT9"
        )
        == expected_response
    )

    # test that it will try subsequent clients if first one fails
    client_mocks[0].get_signatures_for_address.side_effect = Exception()
    client_mocks[1].get_signatures_for_address.side_effect = Exception()
    client_mocks[2].get_signatures_for_address.return_value = expected_response
    assert (
        solana_client_manager.get_signatures_for_address(
            "JsP7ivVoNhQZXMDmQd5m6VP6mYmycdCFHzK3i2jAmT9"
        )
        == expected_response
    )

    # test exception raised if all requests fail
    client_mocks[0].get_signatures_for_address.side_effect = Exception()
    client_mocks[1].get_signatures_for_address.side_effect = Exception()
    client_mocks[2].get_signatures_for_address.side_effect = Exception()
    with pytest.raises(Exception):
        solana_client_manager.get_signatures_for_address(
            "JsP7ivVoNhQZXMDmQd5m6VP6mYmycdCFHzK3i2jAmT9"
        )
