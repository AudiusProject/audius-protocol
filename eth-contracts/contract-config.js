// config values stored by network name. see truffle-config.json for a mapping from network
// name to other params
module.exports = {
  'development': {
    versionerAddress: null,
    treasuryAddress: null
  },
  'test_local': {
    versionerAddress: null,
    treasuryAddress: null
  },
  'audius_private': {
    versionerAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    treasuryAddress: null
  },
  'staging': {
    versionerAddress: '0xcccc7428648c4AdC0ae262D3547584dDAE25c465',
    treasuryAddress: null
  },
  'production': {
    versionerAddress: '0xcccc7428648c4AdC0ae262D3547584dDAE25c465',
    treasuryAddress: null
  }
}
