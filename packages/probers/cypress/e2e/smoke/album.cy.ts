import { route, name } from '../../fixtures/album.json'

describe('Smoke test -- album page @essential', () => {
  it('Should load an album page when visited!', () => {
    cy.visit(route)
    cy.findByRole('heading', { name, level: 1, timeout: 10000 }).should('exist')
  })
})
