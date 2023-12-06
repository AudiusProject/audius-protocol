import { sql } from '../src/db'
import { FollowRow, SaveRow } from '../src/db-tables'

type TableFixture<RowType> = {
  common: RowType
  rows: RowType[]
}

const fixtures = {
  blocks: {
    common: {},
    rows: [
      { blockhash: '0x1', number: 1 },
      { blockhash: '0x2', number: 2 }
    ]
  },

  users: {
    common: {
      is_current: true,
      is_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
      has_collectibles: false,
      txhash: '0x123',
      is_deactivated: false,
      is_available: true,
      is_storage_v2: true,
      allow_ai_attribution: false
    },
    rows: [
      {
        blocknumber: 1,
        user_id: 11,
        handle: 'steve'
      },
      {
        blocknumber: 2,
        user_id: 12,
        handle: 'dave'
      }
    ]
  },

  tracks: {
    common: {
      isCurrent: true,
      isDelete: false,
      created_at: new Date(),
      updated_at: new Date(),
      is_unlisted: false,
      txhash: '0x123',
      is_available: true,
      is_premium: false,
      is_playlist_upload: false,
      track_segments: '[]'
    },
    rows: [
      {
        track_id: 11,
        title: 'Who let the dogs out',
        owner_id: 11
      }
    ]
  },

  follows: {
    common: {
      createdAt: new Date(),
      isCurrent: true,
      isDelete: false,
      txhash: '0x123'
    },
    rows: [
      {
        followerUserId: 11,
        followeeUserId: 12
      }
    ]
  } as TableFixture<FollowRow>,

  saves: {
    common: {
      createdAt: new Date(),
      isCurrent: true,
      isDelete: false,
      txhash: '0x123',
      isSaveOfRepost: false
    },
    rows: [
      {
        userId: 11,
        saveType: 'track',
        saveItemId: 11
      }
    ]
  } as TableFixture<SaveRow>
}

async function main() {
  // truncate tables
  for (const table of Object.keys(fixtures)) {
    await sql`truncate ${sql(table)} cascade`
  }

  // create records
  for (const [table, fixture] of Object.entries(fixtures)) {
    await Promise.all(
      fixture.rows.map(
        (r) =>
          sql`insert into ${sql(table)} ${sql({ ...fixture.common, ...r })}`
      )
    )
  }

  await sql.end()
}

main()
