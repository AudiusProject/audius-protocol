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
    treasuryAddress: '0xcccc7428648c4AdC0ae262D3547584dDAE25c465'
  },
  'production': {
    versionerAddress: '0x6054e3dcec782744ec022c2958c3f9641b764b42',
    treasuryAddress: '0x0da86ededd278072162a866a30806192f2840cd5'
  }
}
