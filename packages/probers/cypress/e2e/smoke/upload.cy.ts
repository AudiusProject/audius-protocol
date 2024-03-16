import user from '../../fixtures/user.json'
describe('Smoke test -- upload page @essential', () => {
  beforeEach(() => {
    localStorage.setItem('HAS_REQUESTED_BROWSER_PUSH_PERMISSION', 'true')
  })

  it('should load upload page when visited', () => {
    const base64Entropy = Buffer.from(user.entropy).toString('base64')
    cy.visit(`trending?login=${base64Entropy}`)

    cy.findByText(user.name, {
      timeout: Cypress.env('initialLoadTimeout')
    }).should('exist')

    cy.visit('upload')

    cy.findByRole('heading', { name: /upload your music/i, level: 1 }).should(
      'exist'
    )
  })
})
