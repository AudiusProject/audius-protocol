import re

from src.utils.ipfs_lib import IPFSClient
from src.utils.config import shared_config

# Convert key to snake case
pattern = re.compile(r'(?<!^)(?=[A-Z])')
# ipfs_client = IPFSClient(
#     shared_config["ipfs"]["host"], shared_config["ipfs"]["port"]
# )

def convert_to_snake_case(value):
    if value == 'ID':
        return 'id'

    return pattern.sub('_', value).lower()

def get_ipfs_peer_info():
    # Convert IPFS object into serializable json object
    ipfs_peer_info = ipfs_client.get_peer_info()
    ipfs_peer_info_json = {}
    for item in ipfs_peer_info.items():
        ipfs_peer_info_json[convert_to_snake_case(item[0])] = item[1]

    return ipfs_peer_info_json
