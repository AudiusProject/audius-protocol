"""fix-indexing-track-slug

Revision ID: ed974e76d415
Revises: cb9aa46f1e46
Create Date: 2021-07-30 15:24:52.899198

"""
from alembic import op
from typing import Any

from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    PrimaryKeyConstraint,
    func,
    orm,
)


revision = "ed974e76d415"
down_revision = "cb9aa46f1e46"
branch_labels = None
depends_on = None


# Copies point in time models in case they change


Base: Any = declarative_base()


class BlockMixin:
    # pylint: disable=property-with-parameters
    @declared_attr
    def __tablename__(self, cls):
        return cls.__name__.lower()

    blockhash = Column(String, primary_key=True)
    number = Column(Integer, nullable=True, unique=True)
    parenthash = Column(String)
    is_current = Column(Boolean)


# inherits from BlockMixin
class Block(Base, BlockMixin):
    __tablename__ = "blocks"

    def __repr__(self):
        return f"<Block(blockhash={self.blockhash},\
parenthash={self.parenthash},number={self.number},\
is_current={self.is_current})>"


class Track(Base):
    __tablename__ = "tracks"

    blockhash = Column(String, ForeignKey("blocks.blockhash"), nullable=False)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)
    txhash = Column(String, default="", nullable=False)
    track_id = Column(Integer, nullable=False)
    is_current = Column(Boolean, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    owner_id = Column(Integer, nullable=False)
    route_id = Column(String, nullable=False)
    title = Column(Text, nullable=True)
    length = Column(Integer, nullable=True)
    cover_art = Column(String, nullable=True)
    cover_art_sizes = Column(String, nullable=True)
    tags = Column(String, nullable=True)
    genre = Column(String, nullable=True)
    mood = Column(String, nullable=True)
    credits_splits = Column(String, nullable=True)
    remix_of = Column(postgresql.JSONB, nullable=True)
    create_date = Column(String, nullable=True)
    release_date = Column(String, nullable=True)
    file_type = Column(String, nullable=True)
    description = Column(String, nullable=True)
    license = Column(String, nullable=True)
    isrc = Column(String, nullable=True)
    iswc = Column(String, nullable=True)
    track_segments = Column(postgresql.JSONB, nullable=False)
    metadata_multihash = Column(String, nullable=True)
    download = Column(postgresql.JSONB, nullable=True)
    updated_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False)
    is_unlisted = Column(Boolean, nullable=False)
    field_visibility = Column(postgresql.JSONB, nullable=True)
    stem_of = Column(postgresql.JSONB, nullable=True)

    @property
    def _slug(self):
        return self._routes[0].slug if self._routes else ""

    @property
    def permalink(self):
        if self.user and self.user[0].handle and self._slug:
            return f"/{self.user[0].handle}/{self._slug}"
        return ""

    PrimaryKeyConstraint(is_current, track_id, blockhash, txhash)

    def __repr__(self):
        return (
            f"<Track("
            f"blockhash={self.blockhash},"
            f"blocknumber={self.blocknumber},"
            f"txhash={self.txhash},"
            f"track_id={self.track_id},"
            f"is_current={self.is_current},"
            f"is_delete={self.is_delete},"
            f"owner_id={self.owner_id},"
            f"route_id={self.route_id},"
            f"title={self.title},"
            f"length={self.length},"
            f"cover_art={self.cover_art},"
            f"cover_art_sizes={self.cover_art_sizes},"
            f"tags={self.tags},"
            f"genre={self.genre},"
            f"mood={self.mood},"
            f"credits_splits={self.credits_splits},"
            f"remix_of={self.remix_of},"
            f"create_date={self.create_date},"
            f"release_date={self.release_date},"
            f"file_type={self.file_type},"
            f"description={self.description},"
            f"license={self.license},"
            f"isrc={self.isrc},"
            f"iswc={self.iswc},"
            f"track_segments={self.track_segments},"
            f"metadata_multihash={self.metadata_multihash},"
            f"download={self.download},"
            f"updated_at={self.updated_at},"
            f"created_at={self.created_at},"
            f"stem_of={self.stem_of},"
            f"permalink={self.permalink}"
            ")>"
        )


class TrackRoute(Base):
    __tablename__ = "track_routes"

    # Actual URL slug for the track, includes collision_id
    slug = Column(String, nullable=False)
    # Just the title piece of the slug for the track, excludes collision_id
    # Used for finding max collision_id needed for duplicate title_slugs
    title_slug = Column(String, nullable=False)
    collision_id = Column(Integer, nullable=False)
    owner_id = Column(Integer, nullable=False)
    track_id = Column(Integer, nullable=False)
    is_current = Column(Boolean, nullable=False)
    blockhash = Column(String, nullable=False)
    blocknumber = Column(Integer, nullable=False)
    txhash = Column(String, nullable=False)

    PrimaryKeyConstraint(owner_id, slug)

    def __repr__(self):
        return f"<TrackRoute(\
slug={self.slug},\
title_slug={self.title_slug},\
collision_id={self.collision_id},\
owner_id={self.owner_id},\
track_id={self.track_id},\
is_current={self.is_current},\
blockhash={self.blockhash},\
blocknumber={self.blocknumber},\
txhash={self.txhash})>"


class SkippedTransaction(Base):
    __tablename__ = "skipped_transactions"

    id = Column(Integer, primary_key=True, nullable=False)
    blocknumber = Column(Integer, nullable=False)
    blockhash = Column(String, nullable=False)
    txhash = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )

    def __repr__(self):
        return f"<SkippedTransaction(\
id={self.id},\
blocknumber={self.blocknumber},\
blockhash={self.blockhash},\
txhash={self.txhash},\
created_at={self.created_at},\
updated_at={self.updated_at})>"


def upgrade():
    bind = op.get_bind()
    session = orm.Session(bind=bind)

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
            # If the block is missing, do not continue
            # This migration is a production hotfix
            return

    session.flush()

    tracks = [
        Track(
            track_id=470883,
            blocknumber=22477107,
            is_current=True,
            is_delete=False,
            txhash="0xd16cd27f8635e84cbb6d02ecf6a5304bae998381cda1291d4cb690d9159196d9",
            blockhash="0x82ba068410ac71a70dfe95708b3c4ec08884355d8384423deb2337a6bcd64dd0",
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
            release_date="Fri Jul 30 2021 17:29:24 GMT+0200",
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
            updated_at="July-30-2021 10:29:40",
            created_at="July-30-2021 10:29:40",
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
            create_date=None,
            release_date="Fri Jul 30 2021 16:55:42 GMT+0200",
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
            updated_at="July-30-2021 10:56:20",
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
            created_at="July-30-2021 10:25:55",
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
            create_date=None,
            release_date="Fri Jul 30 2021 17:29:24 GMT+0200",
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
