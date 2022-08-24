import logging
from typing import Dict

from src.models.users.user import User
from src.tasks.entity_manager.utils import (
    USER_ID_OFFSET,
    Action,
    EntityType,
    ManageEntityParameters,
)
from src.tasks.users import (
    update_legacy_user_images,
    update_user_metadata,
    validate_user_record,
)

logger = logging.getLogger(__name__)


def is_valid_user_tx(params: ManageEntityParameters):
    user_id = params.user_id

    if params.entity_type != EntityType.USER:
        logger.info('wrongg tyep')
        return False

    if params.action == Action.CREATE:
        logger.info('in create')
        if user_id in params.existing_records["users"]:
            logger.info('already excists')
            # user already exists
            return False
        if user_id < USER_ID_OFFSET:
            logger.info('bad id')
            return False
    else:
        # update / delete specific validations
        if user_id not in params.existing_records["users"]:
            logger.info('does not already exists but shold')
            # user does not exist
            return False
        wallet = params.existing_records["users"][user_id].wallet
        if wallet and wallet.lower() != params.signer.lower():
            # user does not match signer
            return False
    return True


def copy_user_record(
    old_user: User, block_number: int, event_blockhash: str, txhash: str
):
    return User(
        user_id=old_user.user_id,
        wallet=old_user.wallet,
        created_at=old_user.created_at,
        updated_at=old_user.updated_at,
        blocknumber=block_number,
        blockhash=event_blockhash,
        txhash=txhash,
        is_current=False,
    )


def update_user_record(params: ManageEntityParameters, user: User, metadata: Dict):
    update_user_metadata(params.session, params.redis, user, metadata, params.web3, params.challenge_bus)
    user.metadata_multihash = params.metadata_cid
    user = update_legacy_user_images(user)
    user = validate_user_record(user)
    return user


def create_user(params: ManageEntityParameters):
    if not is_valid_user_tx(params):
        return

    user_id = params.user_id
    user_metadata = params.ipfs_metadata[params.metadata_cid]

    user_record = User(
        user_id=user_id,
        wallet=params.signer,
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
        created_at=params.block_datetime,
        updated_at=params.block_datetime,
        is_current=False,
    )

    user_record = update_user_metadata(params.session, params.redis, user_record, user_metadata, params.web3, params.challenge_bus)
    user_record.metadata_multihash = params.metadata_cid
    user_record = update_legacy_user_images(user_record)
    user_record = validate_user_record(user_record)
    params.add_user_record(user_id, user_record)
    return user_record


def update_user(params: ManageEntityParameters):
    if not is_valid_user_tx(params):
        return

    user_metadata = params.ipfs_metadata[params.metadata_cid]
    user_id = params.entity_id
    existing_user = params.existing_records["users"][user_id]
    existing_user.is_current = False  # invalidate
    if (
        user_id in params.new_records["users"]
    ):  # override with last updated playlist is in this block
        existing_user = params.new_records["users"][user_id][-1]

    logger.info('got existsing')
    user_record = copy_user_record(
        existing_user, params.block_number, params.event_blockhash, params.txhash
    )

    user_record = update_user_metadata(params.session, params.redis, user_record, user_metadata, params.web3, params.challenge_bus)
    logger.info('did upatedx')
    user_record.metadata_multihash = params.metadata_cid
    user_record = update_legacy_user_images(user_record)
    user_record = validate_user_record(user_record)
    params.add_user_record(user_id, user_record)
    logger.info('adding')
    logger.info('adding')
    logger.info('adding')
    logger.info('adding')
    logger.info('adding')
    return user_record
