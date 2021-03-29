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
  poa_mainnet: { // Bootstrap arguments as of 03/29/21
    verifierAddress: '0xbeef8E42e8B5964fDD2b7ca8efA0d9aef38AA996',
    blacklisterAddress: '0xfeebEA99dE524ac668B6f151177EcA60b30A09c9',
    bootstrapSPIds: [ 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24 ],
    bootstrapSPDelegateWallets: [
      '0xc8d0C29B6d540295e8fc8ac72456F2f4D41088c8',
      '0xf686647E3737d595C60c6DE2f5F90463542FE439',
      '0x0C32BE6328578E99b6F06E0e7A6B385EB8FC13d1',
      '0xC892c75Fa17e8b641a4843D0aa620792857d217A',
      '0xBfdE9a7DD3620CB6428463E9A9e9932B4d10fdc5',
      '0x675086B880260D217963cF14F503272AEb44b2E9',
      '0x6444212FFc23a4CcF7460f8Fe6D0e6074db59036',
      '0xECEDCaABecb40ef4bE733BA47FaD612aeA1F396F',
      '0x08fEF3884Db16E2E6211272cdC9Eee68E8b63b09',
      '0x10fF8197f2e94eF880d940D2414E0A14983c3bFE',
      '0xC23Ee959E0B22a9B0F5dF18D7e7875cA4B6c4236',
      '0x51a5575dc04c1f5f2e39390d090aaf78554F5f7B',
      '0xe0b56BAe2276E016d3DB314Dd7374e596B0457ac',
      '0x54bD4b329FdDb31644553355eF6B7fF3B2F87991',
      '0x875FF7668C9731E6E9ab96F04bC23b4AB5aEeFac',
      '0x7123c721C697F0d5848F4317059E459365c3dFdf',
      '0x18cE2dB7F3c2d6B500C8e54E1F8cfD544BFcB207',
      '0x51Be993907BAd3F11Be09BE558027958Bd482a47',
      '0x9b0D01bd7F01BD6916Ba139743Ce9C524B9375Dd',
      '0x68a4Bd6b4177ffB025AF9844cBE4Fe31348AEE1D',
      '0xf45a6DBf3ce0201F4012a19b1fB04D4f05B53a37',
      '0x9708Fb04DeA029212126255B311a21F1F884cCB4',
      '0x2661FBC1A6fE196cB0eD7a69858eaFdEFb9E8916'
    ],
    bootstrapSPOwnerWallets: [
      '0xe5b256d302ea2f4e04B8F3bfD8695aDe147aB68d',
      '0xe5b256d302ea2f4e04B8F3bfD8695aDe147aB68d',
      '0xe5b256d302ea2f4e04B8F3bfD8695aDe147aB68d',
      '0xccd0855B67F89Ed9058E3BF2926D5380182BbBfc',
      '0xc1f351FE81dFAcB3541e59177AC71Ed237BD15D0',
      '0x8C860adb28CA8A33dB5571536BFCF7D6522181e5',
      '0xc1f351FE81dFAcB3541e59177AC71Ed237BD15D0',
      '0xc1f351FE81dFAcB3541e59177AC71Ed237BD15D0',
      '0xc1f351FE81dFAcB3541e59177AC71Ed237BD15D0',
      '0xc1f351FE81dFAcB3541e59177AC71Ed237BD15D0',
      '0x8C860adb28CA8A33dB5571536BFCF7D6522181e5',
      '0x8C860adb28CA8A33dB5571536BFCF7D6522181e5',
      '0x8C860adb28CA8A33dB5571536BFCF7D6522181e5',
      '0x8C860adb28CA8A33dB5571536BFCF7D6522181e5',
      '0x8C860adb28CA8A33dB5571536BFCF7D6522181e5',
      '0x0C3523357Fe79cC6348902A956d561be6039f462',
      '0x1BD9D60a0103FF2fA25169918392f118Bc616Dc9',
      '0x8C860adb28CA8A33dB5571536BFCF7D6522181e5',
      '0x3FE17C862d90489d0C2393E049fe331B088d8C45',
      '0xc1f351FE81dFAcB3541e59177AC71Ed237BD15D0',
      '0xc1f351FE81dFAcB3541e59177AC71Ed237BD15D0',
      '0xc1f351FE81dFAcB3541e59177AC71Ed237BD15D0',
      '0xD79819bAf3326FAbB7ba95b098e6515a0f6408B8'
    ],
    userReplicaSetBootstrapAddress: null,
    registryAddress: null
  },
  poa_sokol: { // Bootstrap arguments as of 03/22/21
    verifierAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    blacklisterAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    bootstrapSPIds: [3, 4, 5],
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
    userReplicaSetBootstrapAddress: '0x3d2563ACCD9E6D189bA2a61F116905D520054286',
    registryAddress: '0x793373aBF96583d5eb71a15d86fFE732CD04D452'
  }
}
