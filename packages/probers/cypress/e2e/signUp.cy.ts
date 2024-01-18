/* eslint-disable jest/no-identical-title */
import dayjs from 'dayjs'

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

type User = {
  email: string
}

function assertOnSignUpPage() {
  cy.findByRole('heading', { name: /sign up for audius/i, level: 1 }).should(
    'exist'
  )
}

function assertOnCreatePasswordPage(user: User) {
  cy.findByRole('heading', { name: /create your password/i }).should('exist')

  cy.findByText(
    /Create a password that’s secure and easy to remember!/i
  ).should('exist')

  cy.findByText(/your email/i).should('exist')
  cy.findByText(user.email).should('exist')
}

function testSignUp() {
  const testUser = generateTestUser()
  const { email, password, handle, name } = testUser
  cy.visit('signup')
  cy.findByRole('textbox', { name: /email/i }).type(email)
  cy.findByRole('button', { name: /sign up free/i }).click()

  assertOnCreatePasswordPage(testUser)

  // Password inputs dont have a role, so we just check against label text
  // https://github.com/testing-library/dom-testing-library/issues/567#issue-616906804
  cy.findByLabelText(/^password/i).type(password)
  cy.findByLabelText(/confirm password/i).type(password)

  cy.findByRole('button', { name: /continue/i }).click()

  cy.findByRole('heading', { name: /pick your handle/i }).should('exist')
  cy.findByText(/this is how others find and tag you/i).should('exist')
  cy.findByRole('textbox', { name: /handle/i }).type(handle)
  cy.findByRole('button', { name: /continue/i }).click()

  cy.findByRole('heading', { name: /finish your profile/i }).should('exist')
  cy.findByText(/your photos & display name is how others see you./i).should(
    'exist'
  )

  cy.findByTestId('coverPhoto-dropzone').attachFile('cover-photo.jpeg', {
    subjectType: 'drag-n-drop'
  })

  cy.findByTestId('profileImage-dropzone').attachFile('profile-picture.jpeg', {
    subjectType: 'drag-n-drop'
  })

  cy.findByRole('textbox', { name: /display name/i }).type(name)
  cy.findByRole('button', { name: /continue/i }).click()

  cy.findByRole('heading', { name: /select your genres/i }).should('exist')
  cy.findByText(/start by picking some of your favorite genres./i).should(
    'exist'
  )

  cy.findByText(name).should('exist')
  cy.findByText(`@${handle}`).should('exist')

  const genres = [/^acoustic/i, /^pop/i, /^lo-fi/i, /^electronic/i]

  for (const genre of genres) {
    cy.findByRole('checkbox', { name: genre }).check()
  }

  cy.findByRole('button', { name: /continue/i }).click()

  cy.findByRole('heading', { name: /follow at least 3 artists/i }).should(
    'exist'
  )
  cy.findByText(/curate your feed with tracks uploaded/i).should('exist')

  cy.findByRole('radiogroup', { name: /genre/i }).within(() => {
    cy.findByRole('radio', { name: /featured/i }).should('be.checked')

    for (const genre of genres) {
      cy.findByRole('radio', { name: genre }).should('exist')
    }
  })

  function selectArtist(sectionName: RegExp) {
    cy.findByRole('group', { name: sectionName }).within(() => {
      cy.findAllByRole('checkbox', { checked: false }).first().click()
    })
  }

  selectArtist(/pick featured artists/i)

  cy.findByRole('radio', { name: /pop/i }).click()
  selectArtist(/pick pop artists/i)

  cy.findByRole('radio', { name: /electronic/i }).click()
  selectArtist(/pick electronic artists/i)

  cy.findByRole('button', { name: /continue/i }).click()

  cy.findByRole('dialog', { name: /welcome to audius/i }).within(() => {
    cy.findByRole('button', { name: /start listening/i }).click()
  })
}

describe('Sign Up', () => {
  beforeEach(() => {
    localStorage.setItem('FeatureFlagOverride:sign_up_redesign', 'enabled')
  })

  context('desktop', () => {
    it('can navigate to signup from trending', () => {
      cy.visit('trending')
      cy.findByText(/have an account\?/i).should('exist')
      cy.findByRole('link', { name: /sign up/i }).click()
      assertOnSignUpPage()
    })

    it('/signup goes to sign-up', () => {
      cy.visit('signup')
      assertOnSignUpPage()
    })

    it('can navigate to sign-up from sign-in', () => {
      cy.visit('signin')
      cy.findByRole('link', { name: /create an account/i }).click()

      assertOnSignUpPage()
    })

    it('can navigate to sign-up from the public site', () => {
      cy.visit('')
      cy.findByRole('link', { name: /sign up/i }).click()
      assertOnSignUpPage()
    })

    // [C-3593] - skipped until the test can be updated
    it.skip('should create an account', () => {
      testSignUp()
    })
  })

  context('mobile', () => {
    beforeEach(() => {
      cy.viewport('iphone-x')
    })

    it('can navigate to signup from trending', () => {
      cy.visit('trending')
      cy.findByRole('link', { name: /sign up/i }).click()
      assertOnSignUpPage()
    })

    it('/signup goes to sign-up', () => {
      cy.visit('signup')
      assertOnSignUpPage()
    })

    it('can navigate to sign-up from sign-in', () => {
      cy.visit('signin')
      cy.findByRole('link', { name: /create an account/i }).click()

      assertOnSignUpPage()
    })

    it('can navigate to sign-up from the public site', () => {
      cy.visit('')
      cy.findByRole('button', { name: /open nav menu/i }).click()
      cy.findByRole('link', { name: /sign up/i }).click()

      assertOnSignUpPage()
    })

    // [C-3593] - skipped until the test can be updated
    it.skip('should create an account', () => {
      testSignUp()
    })
  })
})
