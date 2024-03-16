describe('Play Track @essential', () => {
  it('should play a trending track', () => {
    cy.visit('trending')
    cy.findByRole('list', { name: /weekly trending tracks/i }).within(() => {
      // Wait for skeletons to not exist to indicate we are done loading
      cy.get('[aria-busy]').should('not.exist')

      cy.findAllByRole('listitem').first().click('left')
    })

    cy.findByRole('button', {
      name: /pause track/i,
      timeout: 20000
    }).should('exist')
    cy.window().its('audio.paused').should('equal', false)
    cy.findByRole('button', {
      name: /pause track/i
    }).click()
    cy.findByRole('button', { name: /play track/i }).should('exist')
    cy.window().its('audio.paused').should('equal', true)
  })
})
