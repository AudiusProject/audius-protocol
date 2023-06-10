// config values stored by network name. see truffle-config.json for a mapping from network
// name to other params
module.exports = {
  development: {
    verifierAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    blacklisterAddress: null,
    bootstrapSPIds: [1, 2, 3],
    bootstrapSPDelegateWallets: ['0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0', '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b', '0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d'],
    bootstrapSPOwnerWallets: ['0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0', '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b', '0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d'],
    userReplicaSetBootstrapAddress: null,
    registryAddress: '0xCfEB869F69431e42cdB54A4F4f105C19C080A601',
    entityManagerAddress: '0x5b9b42d6e4B2e4Bf8d42Eba32D46918e10899B66'
  },
  predeploy: {
    verifierAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    blacklisterAddress: null,
    bootstrapSPIds: process.env.bootstrapSPIds ? process.env.bootstrapSPIds.split(",") : [],
    bootstrapSPDelegateWallets: process.env.bootstrapSPDelegateWallets ? process.env.bootstrapSPDelegateWallets.split(",") : [],
    bootstrapSPOwnerWallets: process.env.bootstrapSPOwnerWallets ? process.env.bootstrapSPOwnerWallets.split(",") : [],
    userReplicaSetBootstrapAddress: null
  },
  test: {
    verifierAddress: null,
    blacklisterAddress: null,
    bootstrapSPIds: [],
    bootstrapSPDelegateWallets: [],
    bootstrapSPOwnerWallets: [],
    userReplicaSetBootstrapAddress: null,
    registryAddress: null
  },
  audius_private: {
    verifierAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    blacklisterAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    bootstrapSPIds: [],
    bootstrapSPDelegateWallets: [],
    bootstrapSPOwnerWallets: [],
    userReplicaSetBootstrapAddress: null,
    registryAddress: null
  }
}
