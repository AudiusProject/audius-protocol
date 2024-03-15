import { route } from '../../fixtures/remixes.json'

describe('Smoke test -- remixes page @essential', () => {
  it('should load a remixes page when visited', () => {
    cy.visit(route)
    cy.findByRole('heading', {
      name: 'Remixes',
      level: 1,
      timeout: 10000
    }).should('exist')
  })
})
