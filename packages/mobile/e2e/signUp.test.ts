import { dayjs } from '@audius/common/utils'
import { device, expect } from 'detox'
import { random } from 'lodash'

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

  it('should create an account', async () => {
    const testUser = generateTestUser()
    const { email, password, handle, name } = testUser

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

    await expect(
      byText(/your photos & display name is how others see you. .*/i)
    ).toBeVisible()

    await byRole('button', {
      name: /select cover photo/i,
      labelOnly: true
    }).tap()
    await byText(/photo library/i).tap()

    await byRole('button', {
      name: /select profile picture/i,
      labelOnly: true
    }).tap()
    await byText(/photo library/i).tap()

    await byRole('textbox', { name: /display name/i }).typeText(name)
    await byRole('button', { name: /continue/i }).tap()

    await expect(
      byRole('heading', { name: /select your genres/i })
    ).toBeVisible()
    await expect(
      byText(/start by picking some of your favorite genres./i)
    ).toBeVisible()

    const genres = [/^acoustic/i, /^pop/i, /^lo-fi/i, /^electronic/i]

    for (const genre of genres) {
      await byRole('checkbox', { name: genre }).tap()
      await expect(byRole('checkbox', { name: genre })).toHaveValue(
        'checkbox, checked'
      )
    }

    await element(by.id('genreScrollView')).scrollTo('bottom')
    await byRole('button', { name: /continue/i }).tap()

    await expect(
      byRole('heading', { name: /follow at least 3 artists/i })
    ).toBeVisible()
    await expect(
      byText(/curate your feed with tracks uploaded .*/i)
    ).toBeVisible()

    await expect(byRole('radio', { name: /featured/i })).toHaveValue(
      'radio button, checked'
    )

    for (const genre of genres) {
      await expect(byRole('radio', { name: genre })).toBeVisible()
    }

    async function selectRandomArtist() {
      const artistElements = await byRole('checkbox', {
        name: /artist-.*/i
      }).getAttributes()

      let randomArtist: Detox.NativeElement
      if ('elements' in artistElements) {
        const numArtists = artistElements.elements.length
        randomArtist = byRole('checkbox', { name: /artist-.*/i }).atIndex(
          random(Math.min(numArtists - 1, 10))
        )
      } else {
        randomArtist = byRole('checkbox', { name: /artist-.*/i })
      }
      await randomArtist.tap()
    }

    await selectRandomArtist()

    await byRole('radio', { name: /acoustic/i }).tap()
    await selectRandomArtist()

    await byRole('radio', { name: /electronic/i }).tap()
    await selectRandomArtist()

    await byRole('button', { name: /continue/i }).tap()
  })
})
