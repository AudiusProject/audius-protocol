import logging
from src.app import contract_addresses
from src.utils import helpers
from src.models import BlacklistedIPLD

logger = logging.getLogger(__name__)


def ipld_blacklist_state_update(
    self, task, session, ipld_blacklist_factory_txs, block_number, block_timestamp
):
    ipld_blacklist_abi = task.abi_values["IPLDBlacklistFactory"]["abi"]
    ipld_blacklist_contract = task.web3.eth.contract(
        address=contract_addresses["ipld_blacklist_factory"], abi=ipld_blacklist_abi
    )

    total_new_ipld_blacklist_events = 0
    for tx_receipt in ipld_blacklist_factory_txs:
        num_new_ipld_blacklist_events = add_to_blacklist(
            self,
            ipld_blacklist_contract,
            task,
            session,
            tx_receipt,
            block_number,
            block_timestamp,
        )

        num_new_ipld_blacklist_events += num_new_ipld_blacklist_events

    return total_new_ipld_blacklist_events


def add_to_blacklist(
    self,
    ipld_blacklist_contract,
    task,
    session,
    tx_receipt,
    block_number,
    block_timestamp,
):
    # Handle AddIPLDToBlacklist event
    new_ipld_blacklist_event = (
        ipld_blacklist_contract.events.AddIPLDToBlacklist().processReceipt(tx_receipt)
    )
    for entry in new_ipld_blacklist_event:
        event_blockhash = task.web3.toHex(entry.blockHash)
        event_args = entry["args"]

        ipld_blacklist_model = BlacklistedIPLD(
            blockhash=event_blockhash,
            blocknumber=block_number,
            ipld=helpers.multihash_digest_to_cid(event_args._multihashDigest),
            is_blacklisted=True,
            is_current=True,
        )

        ipld_blacklist_exists = (
            session.query(BlacklistedIPLD)
            .filter_by(
                blockhash=event_blockhash,
                ipld=helpers.multihash_digest_to_cid(event_args._multihashDigest),
            )
            .count()
            > 0
        )

        if ipld_blacklist_exists:
            continue
        session.add(ipld_blacklist_model)
    return len(new_ipld_blacklist_event)


def is_blacklisted_ipld(session, ipld_blacklist_multihash):
    ipld_blacklist_entry = session.query(BlacklistedIPLD).filter(
        BlacklistedIPLD.ipld == ipld_blacklist_multihash
    )
    return ipld_blacklist_entry.count() > 0
