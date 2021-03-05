const Services = Object.freeze({
  IDENTITY_SERVICE: 'Identity Service',
  HEDGEHOG: 'Hedgehog',
  DISCOVERY_PROVIDER: 'Discovery Provider',
  CREATOR_NODE: 'Creator Node',
  IPFS_GATEWAY: 'IPFS Gateway',
  COMSTOCK: 'Comstock'
})

class Base {
  constructor (
    userStateManager,
    identityService,
    hedgehog,
    discoveryProvider,
    web3Manager,
    contracts,
    ethWeb3Manager,
    ethContracts,
    creatorNode,
    comstock,
    captcha,
    isServer
  ) {
    this.userStateManager = userStateManager
    this.identityService = identityService
    this.hedgehog = hedgehog
    this.discoveryProvider = discoveryProvider
    this.web3Manager = web3Manager
    this.contracts = contracts
    this.ethWeb3Manager = ethWeb3Manager
    this.ethContracts = ethContracts
    this.creatorNode = creatorNode
    this.comstock = comstock
    this.captcha = captcha
    this.isServer = isServer

    this._serviceMapping = {
      [Services.IDENTITY_SERVICE]: this.identityService,
      [Services.HEDGEHOG]: this.hedgehog,
      [Services.DISCOVERY_PROVIDER]: this.discoveryProvider,
      [Services.CREATOR_NODE]: this.creatorNode,
      [Services.COMSTOCK]: this.comstock
    }
  }

  REQUIRES (...services) {
    services.forEach(s => {
      if (!this._serviceMapping[s]) return Base._missingService(services)
    })
  }

  IS_OBJECT (o) {
    if (typeof (o) !== 'object') return Base._invalidType('object')
  }

  OBJECT_HAS_PROPS (o, props, requiredProps) {
    let missingProps = []
    props.forEach(prop => {
      if (!o.hasOwnProperty(prop)) missingProps.push(prop)
    })
    if (missingProps.length > 0) return Base._missingProps(missingProps)

    let missingRequiredProps = []
    requiredProps.forEach(prop => {
      if (!o.hasOwnProperty(prop) || o[prop] === '') missingRequiredProps.push(prop)
    })
    if (missingRequiredProps.length > 0) return Base._missingPropValues(missingRequiredProps)
  }

  FILE_IS_VALID (file) {
    if (this.isServer) {
      if (!file ||
          typeof file !== 'object' ||
          typeof file.pipe !== 'function' ||
          !file.readable) { return Base._invalidFile() }
    } else {
      if (!file ||
        typeof file !== 'object') { return Base._missingFile() }
    }
  }

  /* ------- PRIVATE  ------- */

  static _missingService (...serviceNames) {
    throw new Error(`Requires the following services: ${serviceNames.join(', ')}`)
  }

  static _invalidType (type) {
    throw new Error(`Argument must be of type ${type}`)
  }

  static _missingProps (props) {
    throw new Error(`Missing props ${props.join(', ')}`)
  }

  static _missingPropValues (props) {
    throw new Error(`Missing field values ${props.join(', ')}`)
  }

  static _invalidFile () {
    throw new Error('Expected file as readable stream')
  }

  static _missingFile () {
    throw new Error('Missing or malformed file')
  }
}

module.exports = {
  Base,
  Services
}
