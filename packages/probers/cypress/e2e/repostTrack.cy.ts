import track from '../fixtures/track.json'
import user from '../fixtures/user.json'

function waitForTransaction(transactionNumber: number) {
  cy.intercept({ method: 'POST', url: '**/relay' }).as(
    `relayCheck-${transactionNumber}`
  )
  cy.wait(`@relayCheck-${transactionNumber}`).then((xhr) => {
    const { blockHash, blockNumber } = xhr.response.body.receipt
    cy.intercept({
      url: '**/block_confirmation*',
      query: { blockhash: blockHash, blocknumber: String(blockNumber) }
    }).as(`blockConfirmation-${blockNumber}`)

    waitForBlockConfirmation(`@blockConfirmation-${blockNumber}`)
  })
}

function waitForBlockConfirmation(routeAlias, retries = 3) {
  cy.wait(routeAlias).then((xhr) => {
    const { block_found, block_passed } = xhr.response.body.data
    if (block_found && block_passed) {
    } else if (retries > 0) waitForBlockConfirmation(routeAlias, retries - 1)
    // wait for the next response
    else throw new Error('All requests returned non-200 response')
  })
}

describe('Repost Track', () => {
  beforeEach(() => {
    localStorage.setItem('HAS_REQUESTED_BROWSER_PUSH_PERMISSION', 'true')
  })

  it('should repost and unrepost track correctly', () => {
    const base64Entropy = Buffer.from(user.entropy).toString('base64')
    cy.visit(`${track.route}?login=${base64Entropy}`)

    cy.findByText(user.name, { timeout: 20000 }).should('exist')
    cy.findByRole('heading', { name: track.name, timeout: 20000 }).should(
      'exist'
    )

    cy.findByRole('group', { name: /track actions/i }).within(() => {
      cy.findByRole('button', { name: /repost$/i }).click()
      cy.findByRole('button', { name: /reposted/i }).should('exist')
    })
    waitForTransaction(1)
    cy.reload()

    cy.findByRole('group', { name: /track actions/i }).within(() => {
      cy.findByRole('button', { name: /reposted/i }).click()
      cy.findByRole('button', { name: /repost$/i }).should('exist')
    })

    waitForTransaction(2)
    cy.reload()

    cy.findByRole('group', { name: /track actions/i }).within(() => {
      cy.findByRole('button', { name: /repost$/i }).should('exist')
    })
  })
})
