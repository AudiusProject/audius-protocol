import track from '../fixtures/track.json'
import user from '../fixtures/user.json'

import { waitForTransaction } from './uilts'

describe('Favorite Track', () => {
  beforeEach(() => {
    localStorage.setItem('HAS_REQUESTED_BROWSER_PUSH_PERMISSION', 'true')
  })

  it('should favorite and unfavorite track correctly', () => {
    const base64Entropy = Buffer.from(user.entropy).toString('base64')
    cy.visit(`${track.route}?login=${base64Entropy}`)

    cy.findByText(user.name, { timeout: Cypress.env('initialLoadTimeout') }).should('exist')
    cy.findByRole('heading', { name: track.name, timeout: 20000 }).should(
      'exist'
    )

    cy.findByRole('group', { name: /track actions/i }).within(() => {
      cy.findByRole('button', { name: /favorite$/i }).click()
      cy.findByRole('button', { name: /favorited/i }).should('exist')
    })
    waitForTransaction(1)
    cy.reload()

    cy.findByRole('group', { name: /track actions/i }).within(() => {
      cy.findByRole('button', { name: /favorited/i }).click()
      cy.findByRole('button', { name: /favorite$/i }).should('exist')
    })

    waitForTransaction(2)
    cy.reload()

    cy.findByRole('group', { name: /track actions/i }).within(() => {
      cy.findByRole('button', { name: /favorite$/i }).should('exist')
    })
  })
})
