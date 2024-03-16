import { route, name } from '../../fixtures/remix.json'

describe('Smoke test -- remix page @essential', () => {
  it('should load a remix page when visited', () => {
    cy.visit(route)
    cy.findByRole('heading', { name, level: 1 }).should('exist')
  })
})
