import '@testing-library/cypress/add-commands'
import 'cypress-file-upload'
import 'cypress-wait-until'
import 'cypress-plugin-tab'

import user from '../fixtures/user.json'
const base64Entropy = Buffer.from(user.entropy).toString('base64')

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in user.
       * @example cy.login()
       */
      login(): Chainable<JQuery<HTMLElement>>
    }
  }
}

Cypress.Commands.add('login', () => {
  cy.visit(`trending?login=${base64Entropy}`)
  cy.findByRole('link', { name: user.name }).should('exist')
})
