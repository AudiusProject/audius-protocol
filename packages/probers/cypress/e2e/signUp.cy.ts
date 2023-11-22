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

    // TODO: IN TEST JAIL [C-3403] turn back on when full account creation flow is set up
    it.skip('should create an account', () => {
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
      cy.findByText(
        /your photos & display name is how others see you./i
      ).should('exist')

      cy.findByTestId('cover_photo-dropzone').attachFile('cover-photo.jpeg', {
        subjectType: 'drag-n-drop'
      })

      cy.findByTestId('profile_picture-dropzone').attachFile(
        'profile-picture.jpeg',
        {
          subjectType: 'drag-n-drop'
        }
      )

      cy.findByRole('textbox', { name: /display name/i }).type(name)
      cy.findByRole('button', { name: /continue/i }).click()

      cy.findByRole('heading', { name: /select your genres/i }).should('exist')
      cy.findByText(/start by picking some of your favorite genres./i).should(
        'exist'
      )

      cy.findByText(name).should('exist')
      cy.findByText(handle).should('exist')

      const genres = [/^acoustic/i, /^pop/i, /^lo-fi/i, /^electronic/i]

      for (const genre of genres) {
        cy.findByRole('checkbox', { name: genre }).check()
      }

      cy.findByRole('button', { name: /continue/i }).click()

      cy.findByRole('heading', {
        name: /follow at least 3 artists/i,
        level: 1
      }).should('exist')
      cy.findByText(/curate your feed with tracks uploaded/i).should('exist')

      cy.findByRole('radiogroup', { name: /selected genres/i }).within(() => {
        cy.findByRole('radio', { name: /featured/i }).should('be.checked')

        for (const genre of genres) {
          cy.findByRole('radio', { name: genre }).should('exist')
        }
      })

      cy.findByRole('group', { name: /pick featured artists/i }).within(() => {
        cy.findAllByRole('checkbox').then((artists) => {
          const randomArtist = Cypress._.sample(artists)
          cy.wrap(randomArtist).click()
        })
      })

      cy.findByRole('radio', { name: /pop/i }).click()

      cy.findByRole('group', { name: /pick pop artists/i }).within(() => {
        cy.findAllByRole('checkbox').then((artists) => {
          const randomArtist = Cypress._.sample(artists)
          cy.wrap(randomArtist).click()
        })
      })

      cy.findByRole('radio', { name: /electronic/i }).click()

      cy.findByRole('group', { name: /pick electronic artists/i }).within(
        () => {
          cy.findAllByRole('checkbox').then((artists) => {
            const randomArtist = Cypress._.sample(artists)
            cy.wrap(randomArtist).click()
          })
        }
      )

      cy.findByRole('button', { name: /continue/i }).click()

      cy.findByRole('heading', { name: /get the app/i, level: 2 }).should(
        'exist'
      )
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

    // TODO: IN TEST JAIL [C-3403] turn back on when full account creation flow is set up
    it.skip('should create an account', () => {
      const testUser = generateTestUser()
      const { email, password, handle } = testUser
      cy.visit('signup')
      cy.findByRole('textbox', { name: /email/i }).type(email)
      cy.findByRole('button', { name: /sign up free/i }).click()

      assertOnCreatePasswordPage(testUser)

      cy.findByRole('textbox', { name: /^password/i }).type(password)
      cy.findByRole('textbox', { name: /confirm password/i }).type(password)
      cy.findByRole('button', { name: /continue/i }).click()

      cy.findByRole('heading', { name: /pick your handle/i }).should('exist')
      cy.findByText(/this is how others find and tag you/i).should('exist')
      cy.findByRole('textbox', { name: /handle/i }).type(handle)
      cy.findByRole('button', { name: /continue/i })

      cy.findByRole('heading', { name: /finish your profile/i }).should('exist')
      cy.findByText(
        /your photos & display name is how others see you./i
      ).should('exist')
      cy.findByRole('textbox', { name: /display name/i }).type(handle)
      cy.findByRole('button', { name: /continue/i })
    })
  })
})
