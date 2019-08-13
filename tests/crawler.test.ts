import req from './req'

const URL = process.env.PUBLIC_URL as string

it('resolves with og tags', async () => {
  const options = {
    url: URL,
    headers: {
      'User-Agent': 'slackbot'
    }
  }
  const body = await req(options)
  expect(body.includes(`prefix="og`)).toBe(true)
  expect(body.includes(`<title>Audius</title>`)).toBe(true)
})

it('resolves with og tags', async () => {
  const options = {
    url: URL,
    headers: {
      'User-Agent': 'facebookexternalhit'
    }
  }
  const body = await req(options)
  expect(body.includes(`prefix="og`)).toBe(true)
  expect(body.includes(`<title>Audius</title>`)).toBe(true)
})
