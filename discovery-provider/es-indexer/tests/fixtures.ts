import Knex from 'knex'
import { start } from '../src/main'
import { BlockRow, TrackRow, UserRow } from '../src/types/db'

const kpg = Knex({
  client: 'pg',
  connection: process.env.audius_db_url,
})

let userSeed: Partial<UserRow>[] = [
  { handle: 'dawg', name: 'Mister Dawg' },
  { handle: 'catt', bio: 'asdf' },
  {},
]

let trackSeed: Partial<TrackRow>[] = [
  {
    title: 'dawg jam 2',
  },
]

userSeed = userSeed.map((u, idx) => {
  const defaults: UserRow = {
    blocknumber: idx,
    user_id: idx,
    handle: `handle${idx}`,
    name: `Test User ${idx}`,
    created_at: new Date(),
    updated_at: new Date(),
    is_current: true,
  }
  return Object.assign(defaults, u)
})

trackSeed = trackSeed.map((t, idx) => {
  const defaults: TrackRow = {
    blocknumber: idx,
    track_id: idx,
    owner_id: idx,
    created_at: new Date(),
    updated_at: new Date(),
    is_current: true,
    is_delete: false,
    track_segments: '[]',
  }
  return Object.assign(defaults, t)
})

console.log(trackSeed)

export async function main() {
  if (process.env.NODE_ENV != 'test') {
    console.log('fixtures truncates tables: for safety NODE_ENV must be test')
    process.exit(1)
  }

  const BlocksTable = () => kpg<BlockRow>('blocks')
  const UsersTable = () => kpg<UserRow>('users')
  const TracksTable = () => kpg<TrackRow>('tracks')

  await TracksTable().delete()
  await UsersTable().delete()
  await BlocksTable().delete()

  await BlocksTable().insert(
    Array.from(Array(10).keys()).map((k) => ({
      blockhash: `block${k}`,
      number: k,
    }))
  )
  await UsersTable().insert(userSeed)
  await TracksTable().insert(trackSeed)

  const users = await UsersTable().select()
  console.log('hi', users.length)

  kpg.destroy()

  await start({
    drop: true,
    listen: false,
  })

  console.log('tight')
}

main()
