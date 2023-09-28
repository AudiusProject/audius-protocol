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

function assertOnSignUpPage() {
  cy.findByRole('heading', { name: /sign up for audius/i, level: 1 }).should(
    'exist'
  )
}

describe('Mobile Sign Up', () => {
  beforeEach(() => {
    localStorage.setItem('FeatureFlagOverride:sign_up_redesign', 'enabled')
  })

  context(() => {})
  it('can navigate to sign-up from trending', () => {
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
    cy.findByRole('button', { name: /sign up free/i }).click()

    assertOnSignUpPage()
  })

  it('should create an account', () => {
    const testUser = generateTestUser()
    const { email } = testUser
    cy.visit('signup')
    cy.findByRole('textbox', { name: /email/i }).type(email)
    cy.findByRole('button', { name: /sign up free/i }).click()

    cy.findByRole('heading', { name: /create your password/i }).should('exist')
  })
})
