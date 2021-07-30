"""fix-indexing-track-slug

Revision ID: ed974e76d415
Revises: cb9aa46f1e46
Create Date: 2021-07-30 15:24:52.899198

"""
from alembic import op
from src.models import Block, Track, TrackRoute, SkippedTransaction
from sqlalchemy import orm


# revision identifiers, used by Alembic.
revision = "ed974e76d415"
down_revision = "cb9aa46f1e46"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    session = orm.Session(bind=bind)

    # Create the blocks if non-existent
    blocks = [
        {
            "blocknumber": 22477107,
            "txhash": "0xd16cd27f8635e84cbb6d02ecf6a5304bae998381cda1291d4cb690d9159196d9",
            "blockhash": "0x82ba068410ac71a70dfe95708b3c4ec08884355d8384423deb2337a6bcd64dd0",
        },
        {
            "blocknumber": 22477427,
            "txhash": "0x135c236ebb4d02a1d2bc13bf946e982871ad59a29ed413bbe6aed2acb60a1f17",
            "blockhash": "0x63b16e801cb90f3497043a904e0180a8161d9bbb45add0a9380e277b0befbbba",
        },
        {
            "blocknumber": 22477062,
            "txhash": "0x05771964bc0527268c330b78bb1819998d589d31a95e5f2f8aa846041de1dfee",
            "blockhash": "0x8e5f3edd55d1c7f3d6484a8fb7d2a9d825fb53ecb446c8959dd3887fa999d2e7",
        },
        {
            "blocknumber": 22477832,
            "txhash": "0xda0b64477469390eaa3b17098c01f3e03e5b0e52959ffd493804538dda039a92",
            "blockhash": "0x705d01ed50cf8f1d83686acc19c9d0bdd52493b3552532543629cdf07fba6005",
        },
    ]
    for block in blocks:
        block_query = (
            session.query(Block)
            .filter(
                Block.blockhash == block["blockhash"],
                Block.number == block["blocknumber"],
            )
            .first()
        )
        if not block_query:
            session.add(
                Block(
                    blockhash=block["blockhash"],
                    number=block["blocknumber"],
                    is_current=False,
                )
            )
    session.flush()

    tracks = [
        # trackId - 470883, blocknumber - 22477107
        Track(
            track_id=470883,
            blocknumber=22477107,
            is_current=True,
            is_delete=False,
            txhash="0xd16cd27f8635e84cbb6d02ecf6a5304bae998381cda1291d4cb690d9159196d9",  # TODO: Fill it out
            blockhash="0x82ba068410ac71a70dfe95708b3c4ec08884355d8384423deb2337a6bcd64dd0",  # TODO: Fill it out
            owner_id=3538,
            route_id="",
            cover_art=None,
            cover_art_sizes="QmZFgQiupP2KWoqYZGqJ83zEwHtXMj6QhnNNfDCLpTax4q",
            title="???",
            tags="electro,house,2021",
            genre="Electro",
            mood="Fiery",
            credits_splits=None,
            remix_of=None,
            create_date="",  # TODO: get date
            release_date="Fri Jul 30 2021 17:29:24 GMT+0200",  # TODO: check if converts
            length=None,
            file_type=None,
            description=None,
            license="All rights reserved",
            isrc=None,
            iswc=None,
            track_segments=[
                {
                    "multihash": "QmW7kQwqbZcYWQHtYdXK6KezSCqQ1vRdwhdWtWvTT79rnk",
                    "duration": 6.016,
                },
                {
                    "multihash": "QmYQEkQvPGHgkMLGhvfYcZdd385KmoifAer5kxnAuYhf4E",
                    "duration": 5.994667,
                },
                {
                    "multihash": "QmVj5uvFPBpa9635hL17EcYPJAQURm6rqJdvociR6Qk1Q2",
                    "duration": 5.994667,
                },
                {
                    "multihash": "QmW5QyPo5kUSXs1v5oJTrLWdFB1JHciWKcMpw3GbY7a7rX",
                    "duration": 5.994667,
                },
                {
                    "multihash": "QmZeRjqj9SC1depFGw5vLwdAiayBr7rdrtSiUKYtoFaJix",
                    "duration": 6,
                },
                {
                    "multihash": "QmQ2dPUnNMay2Yxj6pj7Jw7WvpodXoQxZvUTdSKjMcoF56",
                    "duration": 0.021333,
                },
            ],
            download={
                "is_downloadable": False,
                "requires_follow": False,
                "cid": None,
            },
            updated_at="July-30-2021 10:29:40",  # Get blocktimedate
            created_at="July-30-2021 10:29:40",  # Get blocktimedate
            is_unlisted=False,
            field_visibility={
                "genre": True,
                "mood": True,
                "tags": True,
                "share": True,
                "play_count": True,
                "remixes": True,
            },
            stem_of=None,
        ),
        # trackId - 470884, blocknumber - 22477427
        Track(
            track_id=470884,
            blocknumber=22477427,
            is_current=True,
            is_delete=False,
            txhash="0x135c236ebb4d02a1d2bc13bf946e982871ad59a29ed413bbe6aed2acb60a1f17",
            blockhash="0x63b16e801cb90f3497043a904e0180a8161d9bbb45add0a9380e277b0befbbba",
            owner_id=3538,
            route_id="",
            cover_art=None,
            cover_art_sizes="QmZFgQiupP2KWoqYZGqJ83zEwHtXMj6QhnNNfDCLpTax4q",
            title="???",
            tags="electro,house,2021",
            genre="Electro",
            mood="Fiery",
            credits_splits=None,
            remix_of=None,
            create_date="",  # TODO: get date
            release_date="Fri Jul 30 2021 16:55:42 GMT+0200",  # TODO: check if converts
            length=None,
            file_type=None,
            description=None,
            license="All rights reserved",
            isrc=None,
            iswc=None,
            track_segments=[
                {
                    "multihash": "QmW7kQwqbZcYWQHtYdXK6KezSCqQ1vRdwhdWtWvTT79rnk",
                    "duration": 6.016,
                },
                {
                    "multihash": "QmYQEkQvPGHgkMLGhvfYcZdd385KmoifAer5kxnAuYhf4E",
                    "duration": 5.994667,
                },
                {
                    "multihash": "QmVj5uvFPBpa9635hL17EcYPJAQURm6rqJdvociR6Qk1Q2",
                    "duration": 5.994667,
                },
                {
                    "multihash": "QmW5QyPo5kUSXs1v5oJTrLWdFB1JHciWKcMpw3GbY7a7rX",
                    "duration": 5.994667,
                },
                {
                    "multihash": "QmZeRjqj9SC1depFGw5vLwdAiayBr7rdrtSiUKYtoFaJix",
                    "duration": 6,
                },
                {
                    "multihash": "QmQ2dPUnNMay2Yxj6pj7Jw7WvpodXoQxZvUTdSKjMcoF56",
                    "duration": 0.021333,
                },
            ],
            download={
                "is_downloadable": False,
                "requires_follow": False,
                "cid": None,
            },
            updated_at="July-30-2021 10:56:20",  # Get blocktimedate
            created_at="July-30-2021 10:56:20",
            is_unlisted=False,
            field_visibility={
                "genre": True,
                "mood": True,
                "tags": True,
                "share": True,
                "play_count": True,
                "remixes": True,
            },
            stem_of=None,
        ),
        # trackId - 470892, blocknumber - 22477062
        Track(
            track_id=470892,
            blocknumber=22477062,
            is_current=True,
            is_delete=False,
            txhash="0x05771964bc0527268c330b78bb1819998d589d31a95e5f2f8aa846041de1dfee",
            blockhash="0x8e5f3edd55d1c7f3d6484a8fb7d2a9d825fb53ecb446c8959dd3887fa999d2e7",
            owner_id=3538,
            route_id="",
            cover_art=None,
            cover_art_sizes="QmZFgQiupP2KWoqYZGqJ83zEwHtXMj6QhnNNfDCLpTax4q",
            title="???",
            tags="electro,house,2021",
            genre="Electro",
            mood="Fiery",
            credits_splits=None,
            remix_of=None,
            create_date=None,
            release_date="Fri Jul 30 2021 16:24:35 GMT+0200",
            length=None,
            file_type=None,
            description=None,
            license="All rights reserved",
            isrc=None,
            iswc=None,
            track_segments=[
                {
                    "multihash": "QmW7kQwqbZcYWQHtYdXK6KezSCqQ1vRdwhdWtWvTT79rnk",
                    "duration": 6.016,
                },
                {
                    "multihash": "QmYQEkQvPGHgkMLGhvfYcZdd385KmoifAer5kxnAuYhf4E",
                    "duration": 5.994667,
                },
                {
                    "multihash": "QmVj5uvFPBpa9635hL17EcYPJAQURm6rqJdvociR6Qk1Q2",
                    "duration": 5.994667,
                },
                {
                    "multihash": "QmW5QyPo5kUSXs1v5oJTrLWdFB1JHciWKcMpw3GbY7a7rX",
                    "duration": 5.994667,
                },
                {
                    "multihash": "QmZeRjqj9SC1depFGw5vLwdAiayBr7rdrtSiUKYtoFaJix",
                    "duration": 6,
                },
                {
                    "multihash": "QmQ2dPUnNMay2Yxj6pj7Jw7WvpodXoQxZvUTdSKjMcoF56",
                    "duration": 0.021333,
                },
            ],
            download={
                "is_downloadable": False,
                "requires_follow": False,
                "cid": None,
            },
            updated_at="July-30-2021 10:25:55",
            created_at="July-30-2021 10:25:55",  # Get blocktimedate
            is_unlisted=False,
            field_visibility={
                "genre": True,
                "mood": True,
                "tags": True,
                "share": True,
                "play_count": True,
                "remixes": True,
            },
            stem_of=None,
        ),
        # trackId - 470911, blocknumber - 22477832
        Track(
            track_id=470911,
            blocknumber=22477832,
            is_current=True,
            is_delete=False,
            txhash="0xda0b64477469390eaa3b17098c01f3e03e5b0e52959ffd493804538dda039a92",
            blockhash="0x705d01ed50cf8f1d83686acc19c9d0bdd52493b3552532543629cdf07fba6005",
            owner_id=3538,
            route_id="",
            cover_art=None,
            cover_art_sizes="QmZFgQiupP2KWoqYZGqJ83zEwHtXMj6QhnNNfDCLpTax4q",
            title="???",
            tags="electro,house,2021",
            genre="Electro",
            mood="Fiery",
            credits_splits=None,
            remix_of=None,
            create_date="",  # TODO: get date
            release_date="Fri Jul 30 2021 17:29:24 GMT+0200",  # TODO: check if converts
            length=None,
            file_type=None,
            description=None,
            license="All rights reserved",
            isrc=None,
            iswc=None,
            track_segments=[
                {
                    "multihash": "QmW7kQwqbZcYWQHtYdXK6KezSCqQ1vRdwhdWtWvTT79rnk",
                    "duration": 6.016,
                },
                {
                    "multihash": "QmYQEkQvPGHgkMLGhvfYcZdd385KmoifAer5kxnAuYhf4E",
                    "duration": 5.994667,
                },
                {
                    "multihash": "QmVj5uvFPBpa9635hL17EcYPJAQURm6rqJdvociR6Qk1Q2",
                    "duration": 5.994667,
                },
                {
                    "multihash": "QmW5QyPo5kUSXs1v5oJTrLWdFB1JHciWKcMpw3GbY7a7rX",
                    "duration": 5.994667,
                },
                {
                    "multihash": "QmZeRjqj9SC1depFGw5vLwdAiayBr7rdrtSiUKYtoFaJix",
                    "duration": 6,
                },
                {
                    "multihash": "QmQ2dPUnNMay2Yxj6pj7Jw7WvpodXoQxZvUTdSKjMcoF56",
                    "duration": 0.021333,
                },
            ],
            download={
                "is_downloadable": False,
                "requires_follow": False,
                "cid": None,
            },
            updated_at="July-30-2021 11:30:05",
            created_at="July-30-2021 11:30:05",
            is_unlisted=False,
            field_visibility={
                "genre": True,
                "mood": True,
                "tags": True,
                "share": True,
                "play_count": True,
                "remixes": True,
            },
            stem_of=None,
        ),
    ]
    session.add_all(tracks)

    track_routes = [
        TrackRoute(
            slug="oWXPm",
            title_slug="oWXPm",
            collision_id=0,
            owner_id=3538,
            track_id=470883,
            is_current=True,
            txhash="0xd16cd27f8635e84cbb6d02ecf6a5304bae998381cda1291d4cb690d9159196d9",
            blockhash="0x82ba068410ac71a70dfe95708b3c4ec08884355d8384423deb2337a6bcd64dd0",
            blocknumber=22477107,
        ),
        TrackRoute(
            slug="6YBxG",
            title_slug="6YBxG",
            collision_id=0,
            owner_id=3538,
            track_id=470884,
            is_current=True,
            blocknumber=22477427,
            txhash="0x135c236ebb4d02a1d2bc13bf946e982871ad59a29ed413bbe6aed2acb60a1f17",
            blockhash="0x63b16e801cb90f3497043a904e0180a8161d9bbb45add0a9380e277b0befbbba",
        ),
        TrackRoute(
            slug="KV8xz",
            title_slug="KV8xz",
            collision_id=0,
            owner_id=3538,
            track_id=470892,
            is_current=True,
            blocknumber=22477062,
            txhash="0x05771964bc0527268c330b78bb1819998d589d31a95e5f2f8aa846041de1dfee",
            blockhash="0x8e5f3edd55d1c7f3d6484a8fb7d2a9d825fb53ecb446c8959dd3887fa999d2e7",
        ),
        TrackRoute(
            slug="9boPo",
            title_slug="9boPo",
            collision_id=0,
            owner_id=3538,
            track_id=470911,
            is_current=True,
            blocknumber=22477832,
            txhash="0xda0b64477469390eaa3b17098c01f3e03e5b0e52959ffd493804538dda039a92",
            blockhash="0x705d01ed50cf8f1d83686acc19c9d0bdd52493b3552532543629cdf07fba6005",
        ),
    ]
    session.add_all(track_routes)

    session.query(SkippedTransaction).filter(
        SkippedTransaction.txhash.in_(
            [
                "0x05771964bc0527268c330b78bb1819998d589d31a95e5f2f8aa846041de1dfee",
                "0xd16cd27f8635e84cbb6d02ecf6a5304bae998381cda1291d4cb690d9159196d9",
                "0x135c236ebb4d02a1d2bc13bf946e982871ad59a29ed413bbe6aed2acb60a1f17",
                "0xda0b64477469390eaa3b17098c01f3e03e5b0e52959ffd493804538dda039a92",
            ]
        )
    ).delete(synchronize_session="fetch")

    session.commit()


def downgrade():
    
    pass
