// config values stored by network name. see truffle-config.json for a mapping from network
// name to other params
module.exports = {
  development: {
    verifierAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    blacklisterAddress: null,
    bootstrapSPIds: [],
    bootstrapSPDelegateWallets: [],
    bootstrapSPOwnerWallets: [],
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
    bootstrapSPIds: [ 3, 4, 5 ],
    bootstrapSPDelegateWallets: [
      '0x5Af47323Bd946A89d38F107A873ba6C83e3acee1',
      '0xA951cBC410c2C6e1D3047A8Ff2BC161C994FcbD8',
      '0xF24936714293a0FaF39A022138aF58D874289132'
    ],
    bootstrapSPOwnerWallets: [
      '0x5Af47323Bd946A89d38F107A873ba6C83e3acee1',
      '0xA951cBC410c2C6e1D3047A8Ff2BC161C994FcbD8',
      '0xF24936714293a0FaF39A022138aF58D874289132'
    ],
    userReplicaSetBootstrapAddress:'0x3d2563ACCD9E6D189bA2a61F116905D520054286',
    registryAddress: '0x793373aBF96583d5eb71a15d86fFE732CD04D452'
  }
}