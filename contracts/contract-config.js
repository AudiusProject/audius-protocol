// config values stored by network name. see truffle-config.json for a mapping from network
// name to other params
module.exports = {
  development: {
    verifierAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    blacklisterAddress: null,
    bootstrapSPIds: [1,2,3],
    bootstrapSPDelegateWallets: ['0x96b1fE6C6620e31C179704b5096D6e84ba0615e3', '0x139289B903E1463031d7352db361862167FF6E74', '0xeAE8D7F3044C48d8e1749408eC5886e65f1d53BD'],
    bootstrapSPOwnerWallets: ['0x96b1fE6C6620e31C179704b5096D6e84ba0615e3', '0x139289B903E1463031d7352db361862167FF6E74', '0xeAE8D7F3044C48d8e1749408eC5886e65f1d53BD'],
    userReplicaSetBootstrapAddress: null
  },
  test_local: {
    verifierAddress: null,
    blacklisterAddress: null,
    bootstrapSPIds: [],
    bootstrapSPDelegateWallets: [],
    bootstrapSPOwnerWallets: [],
    userReplicaSetBootstrapAddress: null
  },
  audius_private: {
    verifierAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    blacklisterAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    bootstrapSPIds: [],
    bootstrapSPDelegateWallets: [],
    bootstrapSPOwnerWallets: [],
    userReplicaSetBootstrapAddress: null,
    registryAddress: null
  },
  poa_mainnet: {
    verifierAddress: '0xbeef8E42e8B5964fDD2b7ca8efA0d9aef38AA996',
    blacklisterAddress: '0xfeebEA99dE524ac668B6f151177EcA60b30A09c9',
    bootstrapSPIds: [],
    bootstrapSPDelegateWallets: [],
    bootstrapSPOwnerWallets: [],
    userReplicaSetBootstrapAddress: null,
    registryAddress: null
  },
  poa_sokol: {
    verifierAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    blacklisterAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    bootstrapSPIds: [],
    bootstrapSPDelegateWallets: [],
    bootstrapSPOwnerWallets: [],
    userReplicaSetBootstrapAddress: null,
    registryAddress: null
  }
}