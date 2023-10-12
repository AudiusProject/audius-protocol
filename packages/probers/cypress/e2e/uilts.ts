export const waitForTransaction = (transactionNumber: number) => {
  cy.intercept({ method: 'POST', url: '**/relay' }).as(
    `relayCheck-${transactionNumber}`
  )
  cy.intercept({
    url: '**/block_confirmation*'
  }).as(`blockConfirmation-${transactionNumber}`)

  cy.wait(`@relayCheck-${transactionNumber}`)

  waitForBlockConfirmation(`@blockConfirmation-${transactionNumber}`)
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
