import logging
from datetime import datetime
from src.app import contract_addresses
from src.models import Repost, RepostType, Follow, Playlist
from src.utils.indexing_errors import IndexingError
from src.challenges.challenge_event import ChallengeEvent

logger = logging.getLogger(__name__)


def social_feature_state_update(
    self,
    update_task,
    session,
    social_feature_factory_txs,
    block_number,
    block_timestamp,
    block_hash,
):
    """Return int representing number of social feature related state changes in this transaction"""

    num_total_changes = 0
    if not social_feature_factory_txs:
        return num_total_changes

    social_feature_factory_abi = update_task.abi_values["SocialFeatureFactory"]["abi"]
    social_feature_factory_contract = update_task.web3.eth.contract(
        address=contract_addresses["social_feature_factory"],
        abi=social_feature_factory_abi,
    )
    challenge_bus = update_task.challenge_event_bus
    block_datetime = datetime.utcfromtimestamp(block_timestamp)

    # stores net state changes of all reposts and follows and corresponding events in current block
    #   track_repost_state_changes = { "user_id": { "track_id": {__Repost__} } }
    #   playlist_repost_state_changes = { "user_id": { "playlist_id": {__Repost__} } }
    #   follow_state_changes = { "follower_user_id": { "followee_user_id": {__Follow__} } }
    track_repost_state_changes = {}
    playlist_repost_state_changes = {}
    follow_state_changes = {}

    for tx_receipt in social_feature_factory_txs:
        try:
            add_track_repost(
                self,
                social_feature_factory_contract,
                update_task,
                session,
                tx_receipt,
                block_number,
                block_datetime,
                track_repost_state_changes,
            )
            delete_track_repost(
                self,
                social_feature_factory_contract,
                update_task,
                session,
                tx_receipt,
                block_number,
                block_datetime,
                track_repost_state_changes,
            )
            add_playlist_repost(
                self,
                social_feature_factory_contract,
                update_task,
                session,
                tx_receipt,
                block_number,
                block_datetime,
                playlist_repost_state_changes,
            )
            delete_playlist_repost(
                self,
                social_feature_factory_contract,
                update_task,
                session,
                tx_receipt,
                block_number,
                block_datetime,
                playlist_repost_state_changes,
            )
            add_follow(
                self,
                social_feature_factory_contract,
                update_task,
                session,
                tx_receipt,
                block_number,
                block_datetime,
                follow_state_changes,
            )
            delete_follow(
                self,
                social_feature_factory_contract,
                update_task,
                session,
                tx_receipt,
                block_number,
                block_datetime,
                follow_state_changes,
            )
        except Exception as e:
            logger.info(f"Error in parse track transaction")
            txhash = update_task.web3.toHex(tx_receipt.transactionHash)
            blockhash = update_task.web3.toHex(block_hash)
            raise IndexingError(
                "social_feature", block_number, blockhash, txhash, str(e)
            )

    # bulk process all repost and follow changes

    for repost_user_id in track_repost_state_changes:
        for repost_track_id in track_repost_state_changes[repost_user_id]:
            invalidate_old_repost(
                session, repost_user_id, repost_track_id, RepostType.track
            )
            repost = track_repost_state_changes[repost_user_id][repost_track_id]
            session.add(repost)
            dispatch_challenge_repost(session, challenge_bus, repost, block_number)
        num_total_changes += len(track_repost_state_changes[repost_user_id])

    for repost_user_id in playlist_repost_state_changes:
        for repost_playlist_id in playlist_repost_state_changes[repost_user_id]:
            invalidate_old_repost(
                session,
                repost_user_id,
                repost_playlist_id,
                playlist_repost_state_changes[repost_user_id][
                    repost_playlist_id
                ].repost_type,
            )
            repost = playlist_repost_state_changes[repost_user_id][repost_playlist_id]
            session.add(repost)
            dispatch_challenge_repost(session, challenge_bus, repost, block_number)
        num_total_changes += len(playlist_repost_state_changes[repost_user_id])

    for follower_user_id in follow_state_changes:
        for followee_user_id in follow_state_changes[follower_user_id]:
            invalidate_old_follow(session, follower_user_id, followee_user_id)
            follow = follow_state_changes[follower_user_id][followee_user_id]
            session.add(follow)
            dispatch_challenge_follow(session, challenge_bus, follow, block_number)
        num_total_changes += len(follow_state_changes[follower_user_id])

    return num_total_changes


######## HELPERS ########


def dispatch_challenge_repost(session, bus, repost, block_number):
    bus.dispatch(session, ChallengeEvent.repost, block_number, repost.user_id)


def dispatch_challenge_follow(session, bus, follow, block_number):
    bus.dispatch(session, ChallengeEvent.follow, block_number, follow.follower_user_id)


def invalidate_old_repost(session, repost_user_id, repost_item_id, repost_type):
    # update existing db entry to is_current = False
    num_invalidated_repost_entries = (
        session.query(Repost)
        .filter(
            Repost.user_id == repost_user_id,
            Repost.repost_item_id == repost_item_id,
            Repost.repost_type == repost_type,
            Repost.is_current == True,
        )
        .update({"is_current": False})
    )
    # TODO - after on-chain storage is implemented, assert num_invalidated_repost_entries > 0
    return num_invalidated_repost_entries


def invalidate_old_follow(session, follower_user_id, followee_user_id):
    # update existing db entry to is_current = False
    num_invalidated_follow_entries = (
        session.query(Follow)
        .filter(
            Follow.follower_user_id == follower_user_id,
            Follow.followee_user_id == followee_user_id,
            Follow.is_current == True,
        )
        .update({"is_current": False})
    )
    # TODO - after on-chain storage is implemented, assert num_invalidated_follow_entries > 0
    return num_invalidated_follow_entries


def add_track_repost(
    self,
    social_feature_factory_contract,
    update_task,
    session,
    tx_receipt,
    block_number,
    block_datetime,
    track_repost_state_changes,
):
    txhash = update_task.web3.toHex(tx_receipt.transactionHash)
    new_track_repost_events = (
        social_feature_factory_contract.events.TrackRepostAdded().processReceipt(
            tx_receipt
        )
    )
    for event in new_track_repost_events:
        event_args = event["args"]
        repost_user_id = event_args._userId
        repost_track_id = event_args._trackId

        if (repost_user_id in track_repost_state_changes) and (
            repost_track_id in track_repost_state_changes[repost_user_id]
        ):
            track_repost_state_changes[repost_user_id][
                repost_track_id
            ].is_delete = False
        else:
            repost = Repost(
                blockhash=update_task.web3.toHex(event.blockHash),
                blocknumber=block_number,
                txhash=txhash,
                user_id=repost_user_id,
                repost_item_id=repost_track_id,
                repost_type=RepostType.track,
                is_current=True,
                is_delete=False,
                created_at=block_datetime,
            )
            if repost_user_id in track_repost_state_changes:
                track_repost_state_changes[repost_user_id][repost_track_id] = repost
            else:
                track_repost_state_changes[repost_user_id] = {repost_track_id: repost}


def delete_track_repost(
    self,
    social_feature_factory_contract,
    update_task,
    session,
    tx_receipt,
    block_number,
    block_datetime,
    track_repost_state_changes,
):
    txhash = update_task.web3.toHex(tx_receipt.transactionHash)
    new_repost_events = (
        social_feature_factory_contract.events.TrackRepostDeleted().processReceipt(
            tx_receipt
        )
    )
    for event in new_repost_events:
        event_args = event["args"]
        repost_user_id = event_args._userId
        repost_track_id = event_args._trackId

        if (repost_user_id in track_repost_state_changes) and (
            repost_track_id in track_repost_state_changes[repost_user_id]
        ):
            track_repost_state_changes[repost_user_id][repost_track_id].is_delete = True
        else:
            repost = Repost(
                blockhash=update_task.web3.toHex(event.blockHash),
                blocknumber=block_number,
                txhash=txhash,
                user_id=repost_user_id,
                repost_item_id=repost_track_id,
                repost_type=RepostType.track,
                is_current=True,
                is_delete=True,
                created_at=block_datetime,
            )
            if repost_user_id in track_repost_state_changes:
                track_repost_state_changes[repost_user_id][repost_track_id] = repost
            else:
                track_repost_state_changes[repost_user_id] = {repost_track_id: repost}


def add_playlist_repost(
    self,
    social_feature_factory_contract,
    update_task,
    session,
    tx_receipt,
    block_number,
    block_datetime,
    playlist_repost_state_changes,
):
    txhash = update_task.web3.toHex(tx_receipt.transactionHash)
    new_playlist_repost_events = (
        social_feature_factory_contract.events.PlaylistRepostAdded().processReceipt(
            tx_receipt
        )
    )
    for event in new_playlist_repost_events:
        event_args = event["args"]
        repost_user_id = event_args._userId
        repost_playlist_id = event_args._playlistId
        repost_type = RepostType.playlist

        playlist_entries = (
            session.query(Playlist)
            .filter(
                Playlist.is_current == True, Playlist.playlist_id == repost_playlist_id
            )
            .all()
        )

        if playlist_entries and playlist_entries[0].is_album:
            repost_type = RepostType.album

        if (repost_user_id in playlist_repost_state_changes) and (
            repost_playlist_id in playlist_repost_state_changes[repost_user_id]
        ):
            playlist_repost_state_changes[repost_user_id][
                repost_playlist_id
            ].is_delete = False
        else:
            repost = Repost(
                blockhash=update_task.web3.toHex(event.blockHash),
                blocknumber=block_number,
                txhash=txhash,
                user_id=repost_user_id,
                repost_item_id=repost_playlist_id,
                repost_type=repost_type,
                is_current=True,
                is_delete=False,
                created_at=block_datetime,
            )
            if repost_user_id in playlist_repost_state_changes:
                playlist_repost_state_changes[repost_user_id][
                    repost_playlist_id
                ] = repost
            else:
                playlist_repost_state_changes[repost_user_id] = {
                    repost_playlist_id: repost
                }


def delete_playlist_repost(
    self,
    social_feature_factory_contract,
    update_task,
    session,
    tx_receipt,
    block_number,
    block_datetime,
    playlist_repost_state_changes,
):
    txhash = update_task.web3.toHex(tx_receipt.transactionHash)
    new_playlist_repost_events = (
        social_feature_factory_contract.events.PlaylistRepostDeleted().processReceipt(
            tx_receipt
        )
    )
    for event in new_playlist_repost_events:
        event_args = event["args"]
        repost_user_id = event_args._userId
        repost_playlist_id = event_args._playlistId
        repost_type = RepostType.playlist

        playlist_entries = (
            session.query(Playlist)
            .filter(
                Playlist.is_current == True, Playlist.playlist_id == repost_playlist_id
            )
            .all()
        )

        if playlist_entries and playlist_entries[0].is_album:
            repost_type = RepostType.album

        if (repost_user_id in playlist_repost_state_changes) and (
            repost_playlist_id in playlist_repost_state_changes[repost_user_id]
        ):
            playlist_repost_state_changes[repost_user_id][
                repost_playlist_id
            ].is_delete = True
        else:
            repost = Repost(
                blockhash=update_task.web3.toHex(event.blockHash),
                blocknumber=block_number,
                txhash=txhash,
                user_id=repost_user_id,
                repost_item_id=repost_playlist_id,
                repost_type=repost_type,
                is_current=True,
                is_delete=True,
                created_at=block_datetime,
            )
            if repost_user_id in playlist_repost_state_changes:
                playlist_repost_state_changes[repost_user_id][
                    repost_playlist_id
                ] = repost
            else:
                playlist_repost_state_changes[repost_user_id] = {
                    repost_playlist_id: repost
                }


def add_follow(
    self,
    social_feature_factory_contract,
    update_task,
    session,
    tx_receipt,
    block_number,
    block_datetime,
    follow_state_changes,
):
    txhash = update_task.web3.toHex(tx_receipt.transactionHash)
    new_follow_events = (
        social_feature_factory_contract.events.UserFollowAdded().processReceipt(
            tx_receipt
        )
    )

    for entry in new_follow_events:
        event_args = entry["args"]
        follower_user_id = event_args._followerUserId
        followee_user_id = event_args._followeeUserId

        if (follower_user_id in follow_state_changes) and (
            followee_user_id in follow_state_changes[follower_user_id]
        ):
            follow_state_changes[follower_user_id][followee_user_id].is_delete = False
        else:
            follow = Follow(
                blockhash=update_task.web3.toHex(entry.blockHash),
                blocknumber=block_number,
                txhash=txhash,
                follower_user_id=follower_user_id,
                followee_user_id=followee_user_id,
                is_current=True,
                is_delete=False,
                created_at=block_datetime,
            )
            if follower_user_id in follow_state_changes:
                follow_state_changes[follower_user_id][followee_user_id] = follow
            else:
                follow_state_changes[follower_user_id] = {followee_user_id: follow}


def delete_follow(
    self,
    social_feature_factory_contract,
    update_task,
    session,
    tx_receipt,
    block_number,
    block_datetime,
    follow_state_changes,
):
    txhash = update_task.web3.toHex(tx_receipt.transactionHash)
    new_follow_events = (
        social_feature_factory_contract.events.UserFollowDeleted().processReceipt(
            tx_receipt
        )
    )

    for entry in new_follow_events:
        event_args = entry["args"]
        follower_user_id = event_args._followerUserId
        followee_user_id = event_args._followeeUserId

        if (follower_user_id in follow_state_changes) and (
            followee_user_id in follow_state_changes[follower_user_id]
        ):
            follow_state_changes[follower_user_id][followee_user_id].is_delete = True
        else:
            follow = Follow(
                blockhash=update_task.web3.toHex(entry.blockHash),
                blocknumber=block_number,
                txhash=txhash,
                follower_user_id=follower_user_id,
                followee_user_id=followee_user_id,
                is_current=True,
                is_delete=True,
                created_at=block_datetime,
            )
            if follower_user_id in follow_state_changes:
                follow_state_changes[follower_user_id][followee_user_id] = follow
            else:
                follow_state_changes[follower_user_id] = {followee_user_id: follow}
