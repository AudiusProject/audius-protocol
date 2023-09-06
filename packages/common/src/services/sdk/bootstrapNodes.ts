import { Env } from '../env'

const devBootstrapNodes = [
  {
    delegateOwnerWallet: '0x0D38e653eC28bdea5A2296fD5940aaB2D0B8875c',
    endpoint: 'http://audius-protocol-creator-node-1'
  },
  {
    delegateOwnerWallet: '0x1B569e8f1246907518Ff3386D523dcF373e769B6',
    endpoint: 'http://audius-protocol-creator-node-2'
  },
  {
    delegateOwnerWallet: '0xCBB025e7933FADfc7C830AE520Fb2FD6D28c1065',
    endpoint: 'http://audius-protocol-creator-node-3'
  }
]

const stagingBootstrapNodes = [
  {
    endpoint: 'https://usermetadata.staging.audius.co',
    delegateOwnerWallet: '0x671ddce7B4E676C9467F87e4031a917b5D6f75F0'
  },
  {
    endpoint: 'https://creatornode5.staging.audius.co',
    delegateOwnerWallet: '0xDC2BDF1F23381CA2eC9e9c70D4FD96CD8645D090'
  },
  {
    endpoint: 'https://creatornode6.staging.audius.co',
    delegateOwnerWallet: '0x68039d001D87E7A5E6B06fe0825EA7871C1Cd6C2'
  },
  {
    endpoint: 'https://creatornode7.staging.audius.co',
    delegateOwnerWallet: '0x1F8e7aF58086992Ef4c4fc0371446974BBbC0D9F'
  },
  {
    endpoint: 'https://creatornode8.staging.audius.co',
    delegateOwnerWallet: '0x8fcFA10Bd3808570987dbb5B1EF4AB74400FbfDA'
  },
  {
    endpoint: 'https://creatornode9.staging.audius.co',
    delegateOwnerWallet: '0x140eD283b33be2145ed7d9d15f1fE7bF1E0B2Ac3'
  },
  {
    endpoint: 'https://creatornode10.staging.audius.co',
    delegateOwnerWallet: '0xf7C96916bd37Ad76D4EEDd6536B81c29706C8056'
  },
  {
    endpoint: 'https://creatornode11.staging.audius.co',
    delegateOwnerWallet: '0x4c88d2c0f4c4586b41621aD6e98882ae904B98f6'
  }
]

const productionBootstrapNodes = [
  {
    delegateOwnerWallet: '0xc8d0C29B6d540295e8fc8ac72456F2f4D41088c8',
    endpoint: 'https://creatornode.audius.co'
  },
  {
    delegateOwnerWallet: '0xf686647E3737d595C60c6DE2f5F90463542FE439',
    endpoint: 'https://creatornode2.audius.co'
  },
  {
    delegateOwnerWallet: '0x0C32BE6328578E99b6F06E0e7A6B385EB8FC13d1',
    endpoint: 'https://creatornode3.audius.co'
  },
  {
    delegateOwnerWallet: '0xC892c75Fa17e8b641a4843D0aa620792857d217A',
    endpoint: 'https://content-node.audius.co'
  },
  {
    delegateOwnerWallet: '0xBfdE9a7DD3620CB6428463E9A9e9932B4d10fdc5',
    endpoint: 'https://audius-content-1.figment.io'
  },
  {
    delegateOwnerWallet: '0x675086B880260D217963cF14F503272AEb44b2E9',
    endpoint: 'https://creatornode.audius.prod-us-west-2.staked.cloud'
  },
  {
    delegateOwnerWallet: '0x6444212FFc23a4CcF7460f8Fe6D0e6074db59036',
    endpoint: 'https://audius-content-2.figment.io'
  },
  {
    delegateOwnerWallet: '0xECEDCaABecb40ef4bE733BA47FaD612aeA1F396F',
    endpoint: 'https://audius-content-3.figment.io'
  },
  {
    delegateOwnerWallet: '0x08fEF3884Db16E2E6211272cdC9Eee68E8b63b09',
    endpoint: 'https://audius-content-4.figment.io'
  },
  {
    delegateOwnerWallet: '0x10fF8197f2e94eF880d940D2414E0A14983c3bFE',
    endpoint: 'https://audius-content-5.figment.io'
  },
  {
    delegateOwnerWallet: '0xC23Ee959E0B22a9B0F5dF18D7e7875cA4B6c4236',
    endpoint: 'https://creatornode.audius1.prod-us-west-2.staked.cloud'
  },
  {
    delegateOwnerWallet: '0x51a5575dc04c1f5f2e39390d090aaf78554F5f7B',
    endpoint: 'https://creatornode.audius2.prod-us-west-2.staked.cloud'
  },
  {
    delegateOwnerWallet: '0xe0b56BAe2276E016d3DB314Dd7374e596B0457ac',
    endpoint: 'https://creatornode.audius3.prod-us-west-2.staked.cloud'
  },
  {
    delegateOwnerWallet: '0x68a4Bd6b4177ffB025AF9844cBE4Fe31348AEE1D',
    endpoint: 'https://audius-content-6.figment.io'
  },
  {
    delegateOwnerWallet: '0xf45a6DBf3ce0201F4012a19b1fB04D4f05B53a37',
    endpoint: 'https://audius-content-7.figment.io'
  },
  {
    delegateOwnerWallet: '0x9708Fb04DeA029212126255B311a21F1F884cCB4',
    endpoint: 'https://audius-content-8.figment.io'
  },
  {
    delegateOwnerWallet: '0xD7E6Fe145874E6c2648F012379699c694b183A2c',
    endpoint: 'https://usermetadata.audius.co'
  },
  {
    delegateOwnerWallet: '0x7c34c9709ed69513D55dF2020e799DA44fC52E6e',
    endpoint: 'https://audius-content-9.figment.io'
  },
  {
    delegateOwnerWallet: '0xff753331CEa586DD5B23bd21222a3c902909F2dd',
    endpoint: 'https://audius-content-10.figment.io'
  },
  {
    delegateOwnerWallet: '0xC9721F892BcC8822eb34237E875BE93904f11073',
    endpoint: 'https://audius-content-11.figment.io'
  },
  {
    delegateOwnerWallet: '0x0A5AEA27A7fB95b51056Df6AaD7fe7E9116eC9B4',
    endpoint: 'https://audius.prod.capturealpha.io'
  },
  {
    delegateOwnerWallet: '0x33Ab85445c8A2690B9488e9fB5E6A9849d3a18d3',
    endpoint: 'https://content.grassfed.network'
  },
  {
    delegateOwnerWallet: '0x807C0fba7405aeb8b6a37A974df6259C6aB9bB1e',
    endpoint: 'https://blockdaemon-audius-content-01.bdnodes.net'
  },
  {
    delegateOwnerWallet: '0xCEb6a23d6132Cfe329b3c8E3c45f9DDc28A62Bd4',
    endpoint: 'https://audius-content-1.cultur3stake.com'
  },
  {
    delegateOwnerWallet: '0x2e9e7A4e35C3136fB651a0dBF8f91c9f5C27BBf7',
    endpoint: 'https://audius-content-2.cultur3stake.com'
  },
  {
    delegateOwnerWallet: '0x742da6cAc2782FeA961bB7B9150a048F5167D1e1',
    endpoint: 'https://audius-content-3.cultur3stake.com'
  },
  {
    delegateOwnerWallet: '0xcbb0cE7481685587b0988195Ff0cD6AA1A701657',
    endpoint: 'https://audius-content-4.cultur3stake.com'
  },
  {
    delegateOwnerWallet: '0xFec4708155277D35d568aD6Ca322262577683584',
    endpoint: 'https://audius-content-5.cultur3stake.com'
  },
  {
    delegateOwnerWallet: '0x3Db0E61591063310eEd22fd57E6f7F1ab2Bb538E',
    endpoint: 'https://audius-content-6.cultur3stake.com'
  },
  {
    delegateOwnerWallet: '0xE6C00e7E8d582fD2856718a5439f1aeEB68e27E5',
    endpoint: 'https://audius-content-7.cultur3stake.com'
  },
  {
    delegateOwnerWallet: '0x4Ad694B3fC34b3cC245aF6AA7B43C52ddD0d7AAE',
    endpoint: 'https://blockdaemon-audius-content-02.bdnodes.net'
  },
  {
    delegateOwnerWallet: '0x8ea81225013719950E968DE0602c4Eca458fA9f4',
    endpoint: 'https://blockdaemon-audius-content-03.bdnodes.net'
  },
  {
    delegateOwnerWallet: '0xcfFA8ACF0b04d9278eEE13928be264b2E9aaab97',
    endpoint: 'https://blockdaemon-audius-content-04.bdnodes.net'
  },
  {
    delegateOwnerWallet: '0xB4Ff0cab630FB05a7fcEfec9E979a968b8f4fE55',
    endpoint: 'https://blockdaemon-audius-content-05.bdnodes.net'
  },
  {
    delegateOwnerWallet: '0x7449da7d1548C11c481b87667EC9b2A8F20C13A0',
    endpoint: 'https://blockdaemon-audius-content-06.bdnodes.net'
  },
  {
    delegateOwnerWallet: '0x00B1CA1A34257860f66e742eF163Ad30bF42d075',
    endpoint: 'https://blockdaemon-audius-content-07.bdnodes.net'
  },
  {
    delegateOwnerWallet: '0x16650eDB44C720ea627d5a59ff0b4f74c37fe419',
    endpoint: 'https://blockdaemon-audius-content-08.bdnodes.net'
  },
  {
    delegateOwnerWallet: '0xD5Cfcf4149c683516239fc653D5a470F3F4A606D',
    endpoint: 'https://blockdaemon-audius-content-09.bdnodes.net'
  },
  {
    delegateOwnerWallet: '0xff432F81D0eb77DA5973Cf55e24A897882fdd3E6',
    endpoint: 'https://audius-content-8.cultur3stake.com'
  },
  {
    delegateOwnerWallet: '0x8464c88502925a0076c381962F8B70b6EC892861',
    endpoint: 'https://blockchange-audius-content-01.bdnodes.net'
  },
  {
    delegateOwnerWallet: '0x5e0D0BeDC11F0B512457f6f707A35703b1447Fb5',
    endpoint: 'https://blockchange-audius-content-02.bdnodes.net'
  },
  {
    delegateOwnerWallet: '0xe3F1c416c3919bB2ffD78F1e38b9E81E8c80815F',
    endpoint: 'https://blockchange-audius-content-03.bdnodes.net'
  },
  {
    delegateOwnerWallet: '0xB6f506557B2e9026743FeA6157e52F204D26690F',
    endpoint: 'https://audius-content-9.cultur3stake.com'
  },
  {
    delegateOwnerWallet: '0x2AF4598D3CF95D8e76987c02BC8A8D71F58d49d5',
    endpoint: 'https://audius-content-10.cultur3stake.com'
  },
  {
    delegateOwnerWallet: '0xB2684Cca5281d2bA6D9Ce66Cca215635FF2Ba466',
    endpoint: 'https://audius-content-11.cultur3stake.com'
  },
  {
    delegateOwnerWallet: '0x28924C99822eA08bFCeDdE3a411308633948b349',
    endpoint: 'https://audius-content-12.cultur3stake.com'
  },
  {
    delegateOwnerWallet: '0xcb23908aa0dCDef762ebEaA38391D8fFC69E6e8F',
    endpoint: 'https://audius-content-13.cultur3stake.com'
  },
  {
    delegateOwnerWallet: '0x47367ED3Db5D9691d866cb09545DE7cccD571579',
    endpoint: 'https://audius-content-16.cultur3stake.com'
  },
  {
    delegateOwnerWallet: '0xb472c555Ab9eA1D33543383d6d1F8885c97eF83A',
    endpoint: 'https://audius-content-17.cultur3stake.com'
  },
  {
    delegateOwnerWallet: '0x4F62C17Dc54E58289354847974E1F246c8EAcf11',
    endpoint: 'https://audius-content-18.cultur3stake.com'
  },
  {
    delegateOwnerWallet: '0x780641e157621621658F118375dc1B36Ea514d46',
    endpoint: 'https://audius-content-12.figment.io'
  },
  {
    delegateOwnerWallet: '0xf9b373E223b73473C59034072263f52aEF60133B',
    endpoint: 'https://cn0.mainnet.audiusindex.org'
  },
  {
    delegateOwnerWallet: '0x9b0D01bd7F01BD6916Ba139743Ce9C524B9375Dd',
    endpoint: 'https://cn1.mainnet.audiusindex.org'
  },
  {
    delegateOwnerWallet: '0xf6e297203c0086dc229DAE17F5b61a15F42A1A00',
    endpoint: 'https://cn2.mainnet.audiusindex.org'
  },
  {
    delegateOwnerWallet: '0x24C4b2cb6eC4c87a03F66723d8750dbe98Fa3e4f',
    endpoint: 'https://cn3.mainnet.audiusindex.org'
  },
  {
    delegateOwnerWallet: '0x33a2da466B14990E0124383204b06F9196f62d8e',
    endpoint: 'https://audius-content-13.figment.io'
  },
  {
    delegateOwnerWallet: '0x817c513C1B702eA0BdD4F8C1204C60372f715006',
    endpoint: 'https://audius-content-14.figment.io'
  },
  {
    delegateOwnerWallet: '0x69e749266C59757dA81F8C659Be6B07ce5Bac6C9',
    endpoint: 'https://cn4.mainnet.audiusindex.org'
  },
  {
    delegateOwnerWallet: '0x125A9f40CFB329266ef415b9510D4E716Dba8Da6',
    endpoint: 'https://audius-content-1.jollyworld.xyz'
  },
  {
    delegateOwnerWallet: '0x0E0aF7035581C615d07372be16D99A9B64E5B2e9',
    endpoint: 'https://audius-creator-1.theblueprint.xyz'
  },
  {
    delegateOwnerWallet: '0x3D0dD2Cd46c2658d228769f4a394662946A28987',
    endpoint: 'https://audius-creator-2.theblueprint.xyz'
  },
  {
    delegateOwnerWallet: '0x292B0d5987a7DE879909C48a54f0853C211da5f3',
    endpoint: 'https://audius-creator-3.theblueprint.xyz'
  },
  {
    delegateOwnerWallet: '0xA815f8108C2772D24D7DCB866c861148f043224D',
    endpoint: 'https://audius-creator-4.theblueprint.xyz'
  },
  {
    delegateOwnerWallet: '0x65Fe5BEf65A0E0b0520d6beE7767ea6Da7f792f6',
    endpoint: 'https://audius-creator-5.theblueprint.xyz'
  },
  {
    delegateOwnerWallet: '0x19B026B0f0Dbf619DBf8C4Efb0190308ace56366',
    endpoint: 'https://audius-creator-6.theblueprint.xyz'
  },
  {
    delegateOwnerWallet: '0xc69F344FCDbc9D747559c968562f682ABfBa442C',
    endpoint: 'https://creatornode.audius8.prod-eks-ap-northeast-1.staked.cloud'
  }
]

export const getBootstrapNodes = (env: Env) =>
  env.ENVIRONMENT === 'staging'
    ? stagingBootstrapNodes
    : env.ENVIRONMENT === 'production'
    ? productionBootstrapNodes
    : devBootstrapNodes
