import user from '../../fixtures/user.json'

describe('Smoke test -- feed page', () => {
  beforeEach(() => {
    localStorage.setItem('HAS_REQUESTED_BROWSER_PUSH_PERMISSION', 'true')
  })

  it('should load feed page when visited', () => {
    const base64Entropy = Buffer.from(user.entropy).toString('base64')
    cy.visit(`trending?login=${base64Entropy}`)

    cy.findByText(user.name, {
      timeout: Cypress.env('initialLoadTimeout')
    }).should('exist')

    cy.visit('feed')

    cy.findByRole('heading', { name: /your feed/i, level: 1 }).should('exist')
  })
})
