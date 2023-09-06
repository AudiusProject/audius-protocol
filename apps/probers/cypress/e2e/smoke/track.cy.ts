import { route, name } from '../../fixtures/track.json'

describe('Smoke test -- track page', () => {
  it('should load a track page when visited', () => {
    cy.visit(route)
    cy.findByRole('heading', { name, level: 1 }).should('exist')
  })
})
