import { device, expect, by } from 'detox'

describe.skip('Sign up', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  it('should open the sign up screen', async () => {
    await expect(element(by.text(/sign up for audius/i))).toBeVisible()
  })
})
