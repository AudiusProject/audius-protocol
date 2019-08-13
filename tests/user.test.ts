import req from './req'

const URL = process.env.PUBLIC_URL as string

it('resolves with the dapp', async () => {
  const options = {
    url: URL,
    headers: {
      'User-Agent': ''
    }
  }
  const body = await req(options)
  expect(body.includes(`reactEnv`)).toBe(true)
})
