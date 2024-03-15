import { route, name } from '../../fixtures/playlist.json'

describe('Smoke test -- playlist page @essential', () => {
  it('should load a playlist page when visited', () => {
    cy.visit(route)
    cy.findByRole('heading', { name, level: 1, timeout: 20000 }).should('exist')
  })
})
