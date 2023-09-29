import '@testing-library/cypress/add-commands'
import 'cypress-file-upload'
import 'cypress-wait-until'
import 'cypress-plugin-tab'

import user from '../fixtures/user.json'
const base64Entropy = Buffer.from(user.entropy).toString('base64')

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in user.
       * @example cy.login()
       */
      login(): Chainable<JQuery<HTMLElement>>
      /**
       * Custom command to visit url from mobile device.
       * @example cy.visitMobile('trending')
       */
      visitMobile(url: string): Chainable<JQuery<HTMLElement>>
    }
  }
}

Cypress.Commands.add('login', () => {
  cy.visit(`trending?login=${base64Entropy}`)
  cy.findByRole('link', { name: user.name }).should('exist')
})

Cypress.Commands.add('visitMobile', (url) => {
  cy.visit(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
    }
  })
})
