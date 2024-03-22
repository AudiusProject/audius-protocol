import logging

import requests

from src.utils.config import shared_config

logger = logging.getLogger(__name__)

helius_num_assets_per_page_limit = 1000


class HeliusClient:
    def __init__(self, api_url: str):
        # the api url should also include the api key
        # e.g. https://mainnet.helius-rpc.com/?api-key=<api-key>
        self.api_url = api_url

    def get_nfts_for_wallet(self, wallet: str):
        body = {
            "id": "test-drive",  # todo: what should this be
            "jsonrpc": "2.0",
            "method": "getAssetsByOwner",
            "params": {
                "ownerAddress": wallet,
                "page": 1,
                "limit": helius_num_assets_per_page_limit,
                "after": "",
                "before": "",
                "displayOptions": {
                    "showUnverifiedCollections": False,
                    "showCollectionMetadata": True,
                },
            },
        }
        try:
            # todo: add pagination
            response = requests.post(self.api_url, json=body)
            json = response.json()
            result = json.get("result", {})
            # total = result.get("total")
            # limit = result.get("limit")
            # page = result.get("page")
            items = result.get("items", [])
            return items
        except Exception as e:
            logger.error(
                f"helius_client.py | Error getting nfts for wallet {wallet}: {e}"
            )
            return []


helius_client = HeliusClient(shared_config["nft"]["helius_das_api_url"])
