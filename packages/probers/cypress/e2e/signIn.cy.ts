function assertOnSignInPage() {
  cy.findByRole('heading', { name: /sign into audius/i, level: 1 }).should(
    'exist'
  )
}

describe('Sign In', () => {
  beforeEach(() => {
    localStorage.setItem('FeatureFlagOverride:sign_in_redesign', 'enabled')
  })

  it('user should be able to sign in from trending screen', () => {
    cy.visit('trending')
    cy.findByText(/have an account\?/i).should('exist')
    cy.findByRole('link', { name: /sign in/i }).click()
    assertOnSignInPage()
  })

  it('user shuld be able to navigate directly to sign in page', () => {
    cy.visit('signin')
    assertOnSignInPage()
  })

  it('user should be able to sign in from the sign up page', () => {
    cy.visit('signup')
    cy.findByRole('button', { name: /have an account\? sign in/i }).click()
    assertOnSignInPage()
  })

  it('user should be able to create an account instead', () => {
    cy.visit('signin')
    cy.findByRole('link', { name: /create an account/i }).click()
    cy.findByText(/sign up for audius/i).should('exist')
  })
})
