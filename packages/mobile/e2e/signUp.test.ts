import dayjs from 'dayjs'
import { device, expect } from 'detox'

import { byRole, byText } from './matchers'

function generateTestUser() {
  const ts = dayjs().format('YYMMDD_HHmmss')
  const email = `prober+${ts}@audius.co`
  const password = 'Pa$$w0rdTest'
  const name = `Prober ${ts}`
  const handle = `p_${ts}`
  return {
    email,
    password,
    name,
    handle
  }
}

async function assertOnSignUp() {
  await expect(byRole('heading', { name: /sign up for audius/i })).toBeVisible()
}

describe('Sign up', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  afterEach(async () => {
    await device.reloadReactNative()
  })

  it('should open the sign up screen', async () => {
    await assertOnSignUp()
  })

  it('can navigate to sign-up from sign-in', async () => {
    await assertOnSignUp()

    await byRole('link', { name: /sign in/i }).tap()
    await expect(byText(/new to audius?/i)).toBeVisible()
    await byRole('link', { name: /sign up/i }).tap()

    await assertOnSignUp()
  })

  it.only('should create an account', async () => {
    const testUser = generateTestUser()
    const { email, password, handle } = testUser
    await byRole('textbox', { name: /email/i }).typeText(email)
    await byRole('button', { name: /sign up free/i }).tap()

    await expect(
      byRole('heading', { name: /create your password/i })
    ).toBeVisible()

    await expect(
      byText(/create a password that's secure and easy to remember! .*/i)
    ).toBeVisible()

    await expect(byText(/your email/i)).toBeVisible()

    await expect(byText(email)).toBeVisible()

    await byRole('textbox', { name: /^password/i }).typeText(password)
    await byRole('textbox', { name: /confirm password/i }).typeText(password)
    await byRole('button', { name: /continue/i }).tap()

    await expect(byRole('heading', { name: /pick your handle/i })).toBeVisible()
    await expect(
      byText(/this is how others find and tag you. .*/i)
    ).toBeVisible()

    await byRole('textbox', { name: /handle/i }).typeText(handle)
    await byRole('button', { name: /continue/i }).tap()
    await expect(
      byRole('heading', { name: /finish your profile/i })
    ).toBeVisible()
  })
})
