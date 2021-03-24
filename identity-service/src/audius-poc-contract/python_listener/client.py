from time import sleep

import base58
import binascii
import codecs
from solana.rpc.api import Client

AUDIUS_PROGRAM = "GxcDzuozY9MPAnpoGw7gQD1dFYgtcwKq1Q7rpkDQUtNE"
CREATE_AND_VERIFY_PROGRAM = "GBpxjk4mKyRW77BwmJPvAL7nyG37pk6MwtQfuYYWkKTt"
SECP_PROGRAM = "KeccakSecp256k11111111111111111111111111111"

SLEEP_TIME = 1

SOLANA_ENDPOINT = "http://localhost:8899"

http_client = Client(SOLANA_ENDPOINT)

slot_from = None
slot_from_2 = None

while True:
    if not slot_from:
        slot_from = http_client.get_slot()["result"]

    if not slot_from_2:
        slot_from_2 = http_client.get_slot()["result"]

    # Monitor eth registry (AUDIUS_PROGRAM)
    transaction = http_client.get_confirmed_signature_for_address2(
        AUDIUS_PROGRAM, limit=1
    )

    # Monitor create and verify program
    transaction2 = http_client.get_confirmed_signature_for_address2(
        CREATE_AND_VERIFY_PROGRAM, limit=1
    )

    print("----")
    print(f"slot_from:{slot_from}")
    print(f"AUDIUS_PROGRAM:{AUDIUS_PROGRAM} | {transaction}")
    print(f"CREATE_AND_VERIFY_PROGRAM:{CREATE_AND_VERIFY_PROGRAM} | {transaction2}")

    # Check tx for eth registry, log statement if found
    transaction_slot = transaction["result"][0]["slot"]
    print(f"AUDIUS_PROGRAM: {transaction_slot} > {slot_from}")
    # if transaction_slot >= slot_from:
    if transaction_slot > slot_from:
        slot_from = transaction["result"][0]["slot"]
        tx_info = http_client.get_confirmed_transaction(
            transaction["result"][0]["signature"]
        )
        if SECP_PROGRAM in tx_info["result"]["transaction"]["message"]["accountKeys"]:
            audius_program_index = tx_info["result"]["transaction"]["message"][
                "accountKeys"
            ].index(AUDIUS_PROGRAM)
            for instruction in tx_info["result"]["transaction"]["message"][
                "instructions"
            ]:
                if instruction["programIdIndex"] == audius_program_index:
                    signed_msg = base58.b58decode(instruction["data"])[65:].decode()
                    print(signed_msg)

    # Check tx for tracklistencount program, log statement if found
    transaction2_slot = transaction2["result"][0]["slot"]
    print(f'CREATE_AND_VERIFY: {transaction2_slot} > {slot_from_2}')
    # Clarify why this check was > and not >=, is this on purpose?
    # if transaction2_slot >= slot_from_2:
    if transaction2_slot >= slot_from_2:
        slot_from_2 = transaction2["result"][0]["slot"]
        tx_info = http_client.get_confirmed_transaction(
            transaction2["result"][0]["signature"]
        )
        if SECP_PROGRAM in tx_info["result"]["transaction"]["message"]["accountKeys"]:
            audius_program_index = tx_info["result"]["transaction"]["message"][
                "accountKeys"
            ].index(CREATE_AND_VERIFY_PROGRAM)
            for instruction in tx_info["result"]["transaction"]["message"][
                "instructions"
            ]:
                if instruction["programIdIndex"] == audius_program_index:
                    try:
                        hex_data = binascii.hexlify(
                            bytearray(list(base58.b58decode(instruction["data"])))
                        )

                        l1 = int(hex_data[2:4], 16)
                        start_data1 = 10
                        end_data1 = l1 * 2 + start_data1

                        l2 = int(hex_data[end_data1 : end_data1 + 2], 16)
                        start_data2 = end_data1 + 8
                        end_data2 = l2 * 2 + start_data2

                        l3 = int(hex_data[end_data2 : end_data2 + 2], 16)
                        start_data3 = end_data2 + 8
                        end_data3 = l3 * 2 + start_data3

                        print(
                            f"Signed data:\nuser_id: {codecs.decode(hex_data[start_data1:end_data1], 'hex')}\ntrack_id: {codecs.decode(hex_data[start_data2:end_data2], 'hex')}\nsource: {codecs.decode(hex_data[start_data3:end_data3], 'hex')}"
                        )

                        print(
                            f"Get 'send message' transaction: {tx_info['result']['transaction']['signatures'][0]}"
                        )
                    except Exception as e:
                        print(e)
    sleep(SLEEP_TIME)
