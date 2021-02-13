// config values stored by network name. see truffle-config.json for a mapping from network
// name to other params
module.exports = {
  development: {
    verifierAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    blacklisterAddress: null,
    bootstrapSPIds: [1,2,3],
    bootstrapSPDelegateWallets: ['0xbe98320Cd41A42C43c2D450a76D08Bf278CC7103', '0x42Ce5a8946c28C2E31e4BFA66722F47Ca1d70d4f', '0xe484fb13b2EA7c0b2d1D3fc605B53dE638a4e4c7'],
    userReplicaSetBootstrapAddress: null
  },
  test_local: {
    verifierAddress: null,
    blacklisterAddress: null,
    bootstrapSPIds: [],
    bootstrapSPDelegateWallets: [],
    userReplicaSetBootstrapAddress: null
  },
  audius_private: {
    verifierAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    blacklisterAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    bootstrapSPIds: [],
    bootstrapSPDelegateWallets: [],
    userReplicaSetBootstrapAddress: null
  },
  poa_mainnet: {
    verifierAddress: '0xbeef8E42e8B5964fDD2b7ca8efA0d9aef38AA996',
    blacklisterAddress: '0xfeebEA99dE524ac668B6f151177EcA60b30A09c9',
    bootstrapSPIds: [],
    bootstrapSPDelegateWallets: [],
    userReplicaSetBootstrapAddress: null
  },
  poa_sokol: {
    verifierAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    blacklisterAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    bootstrapSPIds: [],
    bootstrapSPDelegateWallets: [],
    userReplicaSetBootstrapAddress: null
  }
}