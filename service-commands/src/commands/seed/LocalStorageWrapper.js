const { LocalStorage } = require('node-localstorage')

const {
  Constants
} = require('../../utils')
const {
  HEDGEHOG_ENTROPY_KEY,
  SERVICE_COMMANDS_PATH
} = Constants

class LocalStorageWrapper {
  // local storage wrapper functions - because different instances of
  // localstorage in node don't sync, we must reinstantiate from the path
  // with each read/write to ensure we're getting the correct reference.
  get = () => {
    return new LocalStorage(`${SERVICE_COMMANDS_PATH}/local-storage`)
  }

  getUserEntropy = () => {
    const localStorage = this.get()
    const entropy = localStorage.getItem(HEDGEHOG_ENTROPY_KEY)
    return entropy
  }

  setUserEntropy = hedgehogEntropyKey => {
    const localStorage = this.get()
    localStorage.setItem(HEDGEHOG_ENTROPY_KEY, hedgehogEntropyKey)
  }

  clear = () => {
    const localStorage = this.get()
    localStorage.clear()
  }
}

module.exports = LocalStorageWrapper
