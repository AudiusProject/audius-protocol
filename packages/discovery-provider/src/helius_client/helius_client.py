import logging

import requests

from src.utils.config import shared_config

logger = logging.getLogger(__name__)

HELIUS_NUM_ASSETS_PER_PAGE_LIMIT = 1000


class HeliusClient:
    def __init__(self, api_url: str):
        # the api url should also include the api key
        # e.g. https://mainnet.helius-rpc.com/?api-key=<api-key>
        self.api_url = api_url

    def get_nfts_for_wallet(self, wallet: str):
        nfts = []
        try:
            page = 1
            while True:
                body = {
                    "id": "test-drive",  # todo: what should this be
                    "jsonrpc": "2.0",
                    "method": "getAssetsByOwner",
                    "params": {
                        "ownerAddress": wallet,
                        "page": page,
                        "limit": HELIUS_NUM_ASSETS_PER_PAGE_LIMIT,
                        "sortBy": {"sortBy": "id", "sortDirection": "asc"},
                        "displayOptions": {
                            "showUnverifiedCollections": False,
                            "showCollectionMetadata": True,
                        },
                    },
                }
                response = requests.post(self.api_url, json=body)
                json = response.json()
                result = json.get("result", {})
                items = result.get("items", [])
                nfts.extend(items)
                is_empty_result = len(items) == 0
                is_result_length_below_limit = (
                    len(items) < HELIUS_NUM_ASSETS_PER_PAGE_LIMIT
                )
                if is_empty_result or is_result_length_below_limit:
                    break
                else:
                    page += 1
            return items
        except Exception as e:
            logger.error(
                f"helius_client.py | Encountered error while fetching nfts from Helius for wallet ${wallet}: Returning nfts obtained so far...\nError: ${e}"
            )
            return nfts


helius_client = HeliusClient(shared_config["nft"]["helius_das_api_url"])
