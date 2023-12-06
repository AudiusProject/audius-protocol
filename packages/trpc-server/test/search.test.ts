import { expect, test } from 'vitest'
import { Client as ES } from '@elastic/elasticsearch'

test('search user', async () => {
  // just does a dummy search to confirm ES is working...
  // move this to a trpc router
  let url = process.env.audius_elasticsearch_url
  const esc = new ES({ node: url })
  const found = await esc.search({
    index: 'users',
    q: 'steve'
  })
  expect(found.hits.hits).length(1)
})
