import user from '../fixtures/user.json'

describe('Sign Out @essential', () => {
  beforeEach(() => {
    localStorage.setItem('HAS_REQUESTED_BROWSER_PUSH_PERMISSION', 'true')
  })

  it('should be able to sign out', () => {
    const base64Entropy = Buffer.from(user.entropy).toString('base64')
    cy.visit(`trending?login=${base64Entropy}`)
    cy.findByText(user.name).should('exist')

    cy.visit('settings')

    cy.findByRole('heading', { name: /settings/i, level: 1 }).should('exist')
    cy.findByRole('button', { name: /sign out/i }).click()

    cy.findByRole('dialog', { name: /hold up/i }).within(() => {
      cy.findByRole('button', { name: /sign out/i }).click()
    })

    cy.findByText(/have an account?/i, { timeout: 20000 }).should('exist')
  })
})
