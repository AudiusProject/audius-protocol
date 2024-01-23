import { email, password, name, handle } from '../fixtures/user.json'

describe('Sign In', () => {
  beforeEach(() => {
    localStorage.setItem('FeatureFlagOverride:sign_up_redesign', 'disabled')
  })

  it('should be able to sign in', () => {
    cy.visit('signin')
    cy.findByLabelText(/email/i).type(email)
    cy.findByLabelText(/password/i).type(password)
    cy.findByRole('button', { name: /continue/i }).click()

    cy.findByRole('heading', {
      name: /your feed/i,
      level: 1,
      timeout: 20000
    }).should('exist')

    cy.findByText(name).should('exist')
    cy.findByText(`@${handle}`).should('exist')
  })
})
