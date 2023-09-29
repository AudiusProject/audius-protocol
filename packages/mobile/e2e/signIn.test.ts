import { device, expect, by } from 'detox'

import { email, password } from './fixtures/user.json'
import { byRole } from './matchers'

describe('Sign in', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  afterEach(async () => {
    await device.reloadReactNative()
  })

  it('can navigate to sign-in from sign-up', async () => {
    await expect(
      byRole('heading', { name: /sign up for audius/i })
    ).toBeVisible()
    await byRole('link', { name: /sign in/i }).tap()
    await expect(byRole('heading', { name: /sign into audius/i })).toBeVisible()
  })

  it('can sign in', async () => {
    await expect(
      byRole('heading', { name: /sign up for audius/i })
    ).toBeVisible()
    await byRole('link', { name: /sign in/i }).tap()
    await expect(byRole('heading', { name: /sign into audius/i })).toBeVisible()
    await byRole('textbox', { name: /email/i }).typeText(email)
    await byRole('textbox', { name: /password/i }).typeText(password)
    await byRole('button', { name: /sign in/i }).tap()

    await waitFor(element(by.label(/turn on notifications/i)))
      .toBeVisible()
      .withTimeout(15000)
  })
})
