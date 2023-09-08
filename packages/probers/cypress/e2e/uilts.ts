export const waitForTransaction = (transactionNumber: number) => {
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

const waitForBlockConfirmation = (routeAlias, retries = 3) => {
  cy.wait(routeAlias).then((xhr) => {
    const { block_found, block_passed } = xhr.response.body.data
    if (block_found && block_passed) {
    } else if (retries > 0) waitForBlockConfirmation(routeAlias, retries - 1)
    // wait for the next response
    else throw new Error('All requests returned non-200 response')
  })
}
