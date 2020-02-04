/* global assert */
import { parseDiscprovRegisterTx } from './parser'

/****** EVENT VALIDATOR ******/
export const validateObj = (obj, properties) => {
  for (var p in properties) {
    assert.equal(obj[p], properties[p], 'Expected same ' + p)
  }
}

/** Validate that event output matches inputs */
export const validateDiscprovRegisterEvent = (tx, id, wallet, endpoint) => {
  let event = parseDiscprovRegisterTx(tx)

  // validate all event details
  validateObj(event, { eventName: 'NewDiscoveryProvider', discprovId: id, discprovWallet: wallet, discprovEndpoint: endpoint })

  return event
}

/** Validate that discprov fields matches inputs */
export const validateRegisteredDiscprov = (discprov, wallet, endpoint) => {
  validateObj(discprov, { wallet, endpoint })
}
   