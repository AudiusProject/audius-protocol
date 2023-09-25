import { device, expect, by } from 'detox'

describe('Sign In', () => {
  beforeAll(async () => {
    await device.launchApp()
  })
  it('user should be able to sign in from sign up screen', async () => {
    await expect(element(by.text(/sign up for audius/i))).toBeVisible()
    element(by.traits('button').withDescendant(by.text()))
  })
})
