// config values stored by network name. see truffle-config.json for a mapping from network
// name to other params
module.exports = {
  development: {
    verifierAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    blacklisterAddress: null,
    bootstrapSPIds: [1,2,3],
    bootstrapSPDelegateWallets: ['0xc2542A086011Ae797667964460e33B10f0355A0C', '0x7F68e2E5CfD0200a096C87d1F1A3991d6fb421dF', '0x19AB495435Da2A463dA0B2eF5aD12E9438ab8279'],
    bootstrapSPOwnerWallets: ['0xc2542A086011Ae797667964460e33B10f0355A0C', '0x7F68e2E5CfD0200a096C87d1F1A3991d6fb421dF', '0x19AB495435Da2A463dA0B2eF5aD12E9438ab8279'],
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