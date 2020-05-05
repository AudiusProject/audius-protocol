// config values stored by network name. see truffle-config.json for a mapping from network
// name to other params
module.exports = {
  'development': {
    controllerAddress: null
  },
  'test_local': {
    controllerAddress: null
  },
  'soliditycoverage': {
    controllerAddress: null
  },
  'audius_private': {
    controllerAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0'
  },
  'staging': {
    controllerAddress: '0xcccc7428648c4AdC0ae262D3547584dDAE25c465'
  },
  'production': {
    controllerAddress: '0x6054e3dcec782744ec022c2958c3f9641b764b42'
  }
}
