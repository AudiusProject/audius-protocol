import pytest
from src.solana.solana_client_manager import SolanaClientManager
from unittest import mock

solana_client_manager = SolanaClientManager()


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

    expected_response = {"result": "OK"}

    # test that it returns the client call response
    client_mocks[0].get_confirmed_transaction.return_value = expected_response
    assert (
        solana_client_manager.get_sol_tx_info("transaction signature")
        == expected_response
    )

    # test that it retries the same client before moving on to subsequent clients
    # also test that it will try subsequent clients if first one fails
    client_mocks[0].reset_mock()
    client_mocks[1].reset_mock()
    client_mocks[2].reset_mock()

    num_retries = 2
    client_mocks[0].get_confirmed_transaction.side_effect = Exception()
    client_mocks[1].get_confirmed_transaction.side_effect = Exception()
    client_mocks[2].get_confirmed_transaction.return_value = expected_response
    assert (
        solana_client_manager.get_sol_tx_info("transaction signature", num_retries)
        == expected_response
    )
    assert client_mocks[0].get_confirmed_transaction.call_count == 2
    assert client_mocks[1].get_confirmed_transaction.call_count == 2
    assert client_mocks[2].get_confirmed_transaction.call_count == 1


@mock.patch("solana.rpc.api.Client")
def test_get_signatures_for_address(_):
    client_mocks = [
        mock.Mock(name="first"),
        mock.Mock(name="second"),
        mock.Mock(name="third"),
    ]
    solana_client_manager.clients = client_mocks

    expected_response = {"result": "OK"}

    # test that it returns the client call response
    client_mocks[
        0
    ].get_signatures_for_address.return_value = expected_response
    assert (
        solana_client_manager.get_signatures_for_address(
            "account", "before", "limit"
        )
        == expected_response
    )

    # test that it will try subsequent clients if first one fails
    client_mocks[0].get_signatures_for_address.side_effect = Exception()
    client_mocks[1].get_signatures_for_address.side_effect = Exception()
    client_mocks[
        2
    ].get_signatures_for_address.return_value = expected_response
    assert (
        solana_client_manager.get_signatures_for_address(
            "account", "before", "limit"
        )
        == expected_response
    )

    # test exception raised if all requests fail
    client_mocks[0].get_signatures_for_address.side_effect = Exception()
    client_mocks[1].get_signatures_for_address.side_effect = Exception()
    client_mocks[2].get_signatures_for_address.side_effect = Exception()
    with pytest.raises(Exception):
        solana_client_manager.get_signatures_for_address(
            "account", "before", "limit"
        )
