describe('Smoke test -- trending page', () => {
  it('should load trending page when visited', () => {
    cy.visit('trending')
    cy.findByRole('heading', { name: /trending/i, level: 1 }).should('exist')
  })
})
