import { assert, expect, test } from 'vitest'
import { User } from './generated/graphql'
import { server } from './server'

// TODO: how to populate test fixtures...
//  put in postgres + run es-indexer?
//  or put in es directly?
//
test('Get User', async () => {
  expect(process.env.NODE_ENV).toBe('test')
  expect(process.env.audius_elasticsearch_url).toBe(undefined)

  const query = `
    query UserByHandle($handle: String) {
      users(handle: $handle) {
        id
        handle
        name
        bio
        location
      }
    }
  `

  const response = await server.executeOperation(
    {
      query,
      variables: {
        handle: 'missing',
      },
    },
    {
      // @ts-ignore
      req: {
        headers: {},
        body: {},
      },
    }
  )

  const user = response.data?.users[0] as User
  expect(user.handle).toBe('missing')
  expect(user.name).toBe('m_ssing')

  assert.equal(user.handle, 'missing')
  assert.equal(user.name, 'm_ssing')
})

test('Get Feed', async () => {
  const query = `
  {
    feed(reposts: true, original: true, limit: 4) {
      ... on Playlist {
        name
        owner {
          handle
        }
        
        activity_timestamp
      }
      ... on Track {
        title
        owner {
          name
          handle
        }
        activity_timestamp
        created_at
      }
    }
  }
  `

  const response = await server.executeOperation(
    {
      query,
    },
    {
      // @ts-ignore
      req: {
        headers: {
          'x-user-id': '1',
        },
        body: {},
      },
    }
  )

  const { errors, data } = response
  if (errors) {
    throw new Error(JSON.stringify(errors))
  }

  const feed = data?.feed
  console.log(feed)
  expect(feed).toHaveLength(4)
})
