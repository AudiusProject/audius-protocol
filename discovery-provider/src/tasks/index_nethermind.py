from web3 import HTTPProvider, Web3
from web3.middleware import geth_poa_middleware
import os
import json

web3 = Web3(HTTPProvider("RPC"))
web3.middleware_onion.inject(geth_poa_middleware, layer=0)

def load_abi_values():
    abiDir = os.path.join(os.getcwd(), "build", "contracts")
    jsonFiles = os.listdir(abiDir)
    loaded_abi_values = {}
    for contractJsonFile in jsonFiles:
        fullPath = os.path.join(abiDir, contractJsonFile)
        with open(fullPath) as f:
            data = json.load(f)
            loaded_abi_values[data["contractName"]] = data
    return loaded_abi_values


tx_receipt = web3.eth.get_transaction_receipt("0x3cbb93a1ebe4ed359ddea50e808e0964985a89bec5f23788bef0bca9d07524c3")
entity_manager_address = "0x1Cd8a543596D499B9b6E7a6eC15ECd2B7857Fd64"
entity_manager_abi = load_abi_values()["EntityManager"]["abi"]
entity_manager_inst = web3.eth.contract(
    address=entity_manager_address, abi=entity_manager_abi
)
print(entity_manager_inst.events.ManageEntity().processReceipt(tx_receipt))