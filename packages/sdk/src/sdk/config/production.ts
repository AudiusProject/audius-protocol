/*
 * This file is autogenerated by ./scripts/generateServicesConfig.ts.
 * DO NOT EDIT MANUALLY!
 */
/* eslint-disable prettier/prettier */
import type { SdkServicesConfig } from './types'
export const productionConfig: SdkServicesConfig = {
  "network": {
    "minVersion": "0.7.0",
    "discoveryNodes": [
      {
        "endpoint": "https://audius-metadata-1.figment.io",
        "ownerWallet": "0xc1f351FE81dFAcB3541e59177AC71Ed237BD15D0",
        "delegateOwnerWallet": "0x7db3789e5E2154569e802945ECF2cC92e0994841"
      },
      {
        "endpoint": "https://audius-metadata-2.figment.io",
        "ownerWallet": "0xc1f351FE81dFAcB3541e59177AC71Ed237BD15D0",
        "delegateOwnerWallet": "0x4E2C78d0d3303ed459BF8a3CD87f11A6bc936140"
      },
      {
        "endpoint": "https://discoveryprovider3.audius.co",
        "ownerWallet": "0xe5b256d302ea2f4e04B8F3bfD8695aDe147aB68d",
        "delegateOwnerWallet": "0xF2897993951d53a7E3eb2242D6A14D2028140DC8"
      },
      {
        "endpoint": "https://discoveryprovider2.audius.co",
        "ownerWallet": "0xe5b256d302ea2f4e04B8F3bfD8695aDe147aB68d",
        "delegateOwnerWallet": "0xc97d40C0B992882646D64814151941A1c520b460"
      },
      {
        "endpoint": "https://discoveryprovider.audius.co",
        "ownerWallet": "0xe5b256d302ea2f4e04B8F3bfD8695aDe147aB68d",
        "delegateOwnerWallet": "0xf1a1Bd34b2Bc73629aa69E50E3249E89A3c16786"
      },
      {
        "endpoint": "https://audius-metadata-3.figment.io",
        "ownerWallet": "0xc1f351FE81dFAcB3541e59177AC71Ed237BD15D0",
        "delegateOwnerWallet": "0xE019F1Ad9803cfC83e11D37Da442c9Dc8D8d82a6"
      },
      {
        "endpoint": "https://audius-metadata-4.figment.io",
        "ownerWallet": "0xc1f351FE81dFAcB3541e59177AC71Ed237BD15D0",
        "delegateOwnerWallet": "0xf7441A14A31199744Bf8e7b79405c5446C120D0f"
      },
      {
        "endpoint": "https://dn1.monophonic.digital",
        "ownerWallet": "0x6470Daf3bd32f5014512bCdF0D02232f5640a5BD",
        "delegateOwnerWallet": "0x2CD66a3931C36596efB037b06753476dcE6B4e86"
      },
      {
        "endpoint": "https://audius-dn1.tikilabs.com",
        "ownerWallet": "0xe4882D9A38A2A1fc652996719AF0fb15CB968d0a",
        "delegateOwnerWallet": "0x1cF73c5023572F2d5dc6BD3c5E4F24b4F3b6B76F"
      },
      {
        "endpoint": "https://audius-disc1.nodemagic.com",
        "ownerWallet": "0xf13612C7d6E31636eCC2b670d6F8a3CC50f68A48",
        "delegateOwnerWallet": "0xFD005a90cc8AF8B766F9F9cD95ee91921cC9286d"
      },
      {
        "endpoint": "https://audius-disc2.nodemagic.com",
        "ownerWallet": "0xf13612C7d6E31636eCC2b670d6F8a3CC50f68A48",
        "delegateOwnerWallet": "0x5cA0d3a6590074B9fF31972824178f69e8dAB547"
      }
    ],
    "apiEndpoint": "https://api.audius.co",
    "storageNodes": [
      {
        "endpoint": "https://creatornode.audius.co",
        "delegateOwnerWallet": "0xc8d0C29B6d540295e8fc8ac72456F2f4D41088c8"
      },
      {
        "endpoint": "https://creatornode2.audius.co",
        "delegateOwnerWallet": "0xf686647E3737d595C60c6DE2f5F90463542FE439"
      },
      {
        "endpoint": "https://creatornode3.audius.co",
        "delegateOwnerWallet": "0x0C32BE6328578E99b6F06E0e7A6B385EB8FC13d1"
      },
      {
        "endpoint": "https://audius-content-1.figment.io",
        "delegateOwnerWallet": "0xBfdE9a7DD3620CB6428463E9A9e9932B4d10fdc5"
      },
      {
        "endpoint": "https://creatornode.audius.prod-eks-ap-northeast-1.staked.cloud",
        "delegateOwnerWallet": "0x675086B880260D217963cF14F503272AEb44b2E9"
      },
      {
        "endpoint": "https://audius-content-2.figment.io",
        "delegateOwnerWallet": "0x6444212FFc23a4CcF7460f8Fe6D0e6074db59036"
      },
      {
        "endpoint": "https://audius-content-3.figment.io",
        "delegateOwnerWallet": "0xECEDCaABecb40ef4bE733BA47FaD612aeA1F396F"
      },
      {
        "endpoint": "https://audius-content-4.figment.io",
        "delegateOwnerWallet": "0x08fEF3884Db16E2E6211272cdC9Eee68E8b63b09"
      },
      {
        "endpoint": "https://audius-content-5.figment.io",
        "delegateOwnerWallet": "0x10fF8197f2e94eF880d940D2414E0A14983c3bFE"
      },
      {
        "endpoint": "https://creatornode.audius1.prod-eks-ap-northeast-1.staked.cloud",
        "delegateOwnerWallet": "0xC23Ee959E0B22a9B0F5dF18D7e7875cA4B6c4236"
      },
      {
        "endpoint": "https://creatornode.audius2.prod-eks-ap-northeast-1.staked.cloud",
        "delegateOwnerWallet": "0x51a5575dc04c1f5f2e39390d090aaf78554F5f7B"
      },
      {
        "endpoint": "https://creatornode.audius3.prod-eks-ap-northeast-1.staked.cloud",
        "delegateOwnerWallet": "0xe0b56BAe2276E016d3DB314Dd7374e596B0457ac"
      },
      {
        "endpoint": "https://audius-content-6.figment.io",
        "delegateOwnerWallet": "0x68a4Bd6b4177ffB025AF9844cBE4Fe31348AEE1D"
      },
      {
        "endpoint": "https://audius-content-7.figment.io",
        "delegateOwnerWallet": "0xf45a6DBf3ce0201F4012a19b1fB04D4f05B53a37"
      },
      {
        "endpoint": "https://audius-content-8.figment.io",
        "delegateOwnerWallet": "0x9708Fb04DeA029212126255B311a21F1F884cCB4"
      },
      {
        "endpoint": "https://audius-content-9.figment.io",
        "delegateOwnerWallet": "0x7c34c9709ed69513D55dF2020e799DA44fC52E6e"
      },
      {
        "endpoint": "https://audius-content-10.figment.io",
        "delegateOwnerWallet": "0xff753331CEa586DD5B23bd21222a3c902909F2dd"
      },
      {
        "endpoint": "https://audius-content-11.figment.io",
        "delegateOwnerWallet": "0xC9721F892BcC8822eb34237E875BE93904f11073"
      },
      {
        "endpoint": "https://content.grassfed.network",
        "delegateOwnerWallet": "0x33Ab85445c8A2690B9488e9fB5E6A9849d3a18d3"
      },
      {
        "endpoint": "https://blockdaemon-audius-content-01.bdnodes.net",
        "delegateOwnerWallet": "0x807C0fba7405aeb8b6a37A974df6259C6aB9bB1e"
      },
      {
        "endpoint": "https://audius-content-1.cultur3stake.com",
        "delegateOwnerWallet": "0xCEb6a23d6132Cfe329b3c8E3c45f9DDc28A62Bd4"
      },
      {
        "endpoint": "https://audius-content-2.cultur3stake.com",
        "delegateOwnerWallet": "0x2e9e7A4e35C3136fB651a0dBF8f91c9f5C27BBf7"
      },
      {
        "endpoint": "https://audius-content-3.cultur3stake.com",
        "delegateOwnerWallet": "0x742da6cAc2782FeA961bB7B9150a048F5167D1e1"
      },
      {
        "endpoint": "https://audius-content-4.cultur3stake.com",
        "delegateOwnerWallet": "0xcbb0cE7481685587b0988195Ff0cD6AA1A701657"
      },
      {
        "endpoint": "https://audius-content-5.cultur3stake.com",
        "delegateOwnerWallet": "0xFec4708155277D35d568aD6Ca322262577683584"
      },
      {
        "endpoint": "https://audius-content-6.cultur3stake.com",
        "delegateOwnerWallet": "0x3Db0E61591063310eEd22fd57E6f7F1ab2Bb538E"
      },
      {
        "endpoint": "https://audius-content-7.cultur3stake.com",
        "delegateOwnerWallet": "0xE6C00e7E8d582fD2856718a5439f1aeEB68e27E5"
      },
      {
        "endpoint": "https://blockdaemon-audius-content-02.bdnodes.net",
        "delegateOwnerWallet": "0x4Ad694B3fC34b3cC245aF6AA7B43C52ddD0d7AAE"
      },
      {
        "endpoint": "https://blockdaemon-audius-content-03.bdnodes.net",
        "delegateOwnerWallet": "0x8ea81225013719950E968DE0602c4Eca458fA9f4"
      },
      {
        "endpoint": "https://blockdaemon-audius-content-04.bdnodes.net",
        "delegateOwnerWallet": "0xcfFA8ACF0b04d9278eEE13928be264b2E9aaab97"
      },
      {
        "endpoint": "https://blockdaemon-audius-content-05.bdnodes.net",
        "delegateOwnerWallet": "0xB4Ff0cab630FB05a7fcEfec9E979a968b8f4fE55"
      },
      {
        "endpoint": "https://blockdaemon-audius-content-06.bdnodes.net",
        "delegateOwnerWallet": "0x7449da7d1548C11c481b87667EC9b2A8F20C13A0"
      },
      {
        "endpoint": "https://blockdaemon-audius-content-07.bdnodes.net",
        "delegateOwnerWallet": "0x00B1CA1A34257860f66e742eF163Ad30bF42d075"
      },
      {
        "endpoint": "https://blockdaemon-audius-content-08.bdnodes.net",
        "delegateOwnerWallet": "0x16650eDB44C720ea627d5a59ff0b4f74c37fe419"
      },
      {
        "endpoint": "https://blockdaemon-audius-content-09.bdnodes.net",
        "delegateOwnerWallet": "0xD5Cfcf4149c683516239fc653D5a470F3F4A606D"
      },
      {
        "endpoint": "https://audius-content-8.cultur3stake.com",
        "delegateOwnerWallet": "0xff432F81D0eb77DA5973Cf55e24A897882fdd3E6"
      },
      {
        "endpoint": "https://blockchange-audius-content-01.bdnodes.net",
        "delegateOwnerWallet": "0x8464c88502925a0076c381962F8B70b6EC892861"
      },
      {
        "endpoint": "https://blockchange-audius-content-02.bdnodes.net",
        "delegateOwnerWallet": "0x5e0D0BeDC11F0B512457f6f707A35703b1447Fb5"
      },
      {
        "endpoint": "https://blockchange-audius-content-03.bdnodes.net",
        "delegateOwnerWallet": "0xe3F1c416c3919bB2ffD78F1e38b9E81E8c80815F"
      },
      {
        "endpoint": "https://audius-content-9.cultur3stake.com",
        "delegateOwnerWallet": "0xB6f506557B2e9026743FeA6157e52F204D26690F"
      },
      {
        "endpoint": "https://audius-content-10.cultur3stake.com",
        "delegateOwnerWallet": "0x2AF4598D3CF95D8e76987c02BC8A8D71F58d49d5"
      },
      {
        "endpoint": "https://audius-content-11.cultur3stake.com",
        "delegateOwnerWallet": "0xB2684Cca5281d2bA6D9Ce66Cca215635FF2Ba466"
      },
      {
        "endpoint": "https://audius-content-12.cultur3stake.com",
        "delegateOwnerWallet": "0x28924C99822eA08bFCeDdE3a411308633948b349"
      },
      {
        "endpoint": "https://audius-content-13.cultur3stake.com",
        "delegateOwnerWallet": "0xcb23908aa0dCDef762ebEaA38391D8fFC69E6e8F"
      },
      {
        "endpoint": "https://audius-content-14.cultur3stake.com",
        "delegateOwnerWallet": "0xCbDa351492e52fdb2f0E7FBc440cA2047738b71C"
      },
      {
        "endpoint": "https://audius-content-15.cultur3stake.com",
        "delegateOwnerWallet": "0x2fE2652296c40BB22D33C6379558Bf63A25b4f9a"
      },
      {
        "endpoint": "https://audius-content-16.cultur3stake.com",
        "delegateOwnerWallet": "0x47367ED3Db5D9691d866cb09545DE7cccD571579"
      },
      {
        "endpoint": "https://audius-content-17.cultur3stake.com",
        "delegateOwnerWallet": "0xb472c555Ab9eA1D33543383d6d1F8885c97eF83A"
      },
      {
        "endpoint": "https://audius-content-18.cultur3stake.com",
        "delegateOwnerWallet": "0x4F62C17Dc54E58289354847974E1F246c8EAcf11"
      },
      {
        "endpoint": "https://audius-content-12.figment.io",
        "delegateOwnerWallet": "0x780641e157621621658F118375dc1B36Ea514d46"
      },
      {
        "endpoint": "https://cn0.mainnet.audiusindex.org",
        "delegateOwnerWallet": "0xf9b373E223b73473C59034072263f52aEF60133B"
      },
      {
        "endpoint": "https://cn1.mainnet.audiusindex.org",
        "delegateOwnerWallet": "0x9b0D01bd7F01BD6916Ba139743Ce9C524B9375Dd"
      },
      {
        "endpoint": "https://cn2.mainnet.audiusindex.org",
        "delegateOwnerWallet": "0xf6e297203c0086dc229DAE17F5b61a15F42A1A00"
      },
      {
        "endpoint": "https://cn3.mainnet.audiusindex.org",
        "delegateOwnerWallet": "0x24C4b2cb6eC4c87a03F66723d8750dbe98Fa3e4f"
      },
      {
        "endpoint": "https://audius-content-13.figment.io",
        "delegateOwnerWallet": "0x33a2da466B14990E0124383204b06F9196f62d8e"
      },
      {
        "endpoint": "https://audius-content-14.figment.io",
        "delegateOwnerWallet": "0x817c513C1B702eA0BdD4F8C1204C60372f715006"
      },
      {
        "endpoint": "https://cn4.mainnet.audiusindex.org",
        "delegateOwnerWallet": "0x69e749266C59757dA81F8C659Be6B07ce5Bac6C9"
      },
      {
        "endpoint": "https://audius-creator-1.theblueprint.xyz",
        "delegateOwnerWallet": "0x0E0aF7035581C615d07372be16D99A9B64E5B2e9"
      },
      {
        "endpoint": "https://audius-creator-2.theblueprint.xyz",
        "delegateOwnerWallet": "0x3D0dD2Cd46c2658d228769f4a394662946A28987"
      },
      {
        "endpoint": "https://audius-creator-3.theblueprint.xyz",
        "delegateOwnerWallet": "0x292B0d5987a7DE879909C48a54f0853C211da5f3"
      },
      {
        "endpoint": "https://audius-creator-4.theblueprint.xyz",
        "delegateOwnerWallet": "0xA815f8108C2772D24D7DCB866c861148f043224D"
      },
      {
        "endpoint": "https://audius-creator-5.theblueprint.xyz",
        "delegateOwnerWallet": "0x65Fe5BEf65A0E0b0520d6beE7767ea6Da7f792f6"
      },
      {
        "endpoint": "https://audius-creator-6.theblueprint.xyz",
        "delegateOwnerWallet": "0x19B026B0f0Dbf619DBf8C4Efb0190308ace56366"
      },
      {
        "endpoint": "https://creatornode.audius8.prod-eks-ap-northeast-1.staked.cloud",
        "delegateOwnerWallet": "0xc69F344FCDbc9D747559c968562f682ABfBa442C"
      },
      {
        "endpoint": "https://cn1.stuffisup.com",
        "delegateOwnerWallet": "0x0D16f8bBfFF114B1a525Bf8b8d98ED177FA74AD3"
      },
      {
        "endpoint": "https://audius-cn1.tikilabs.com",
        "delegateOwnerWallet": "0x159200F84c2cF000b3A014cD4D8244500CCc36ca"
      },
      {
        "endpoint": "https://audius-creator-7.theblueprint.xyz",
        "delegateOwnerWallet": "0x720758adEa33433833c14e2516fA421261D0875e"
      },
      {
        "endpoint": "https://cn1.shakespearetech.com",
        "delegateOwnerWallet": "0x44955AD360652c302644F564B42D1458C584A4ec"
      },
      {
        "endpoint": "https://cn2.shakespearetech.com",
        "delegateOwnerWallet": "0x68835714d9c208f9d6F4953F0555507e492fd898"
      },
      {
        "endpoint": "https://cn3.shakespearetech.com",
        "delegateOwnerWallet": "0x7162Ee2b7F0cB9651fd2FA2838B0CAF225B2a8D3"
      },
      {
        "endpoint": "https://audius-creator-8.theblueprint.xyz",
        "delegateOwnerWallet": "0x078842E88B82e6a69549043269AE3aADD5581105"
      },
      {
        "endpoint": "https://audius-creator-9.theblueprint.xyz",
        "delegateOwnerWallet": "0x2DfC8152eF49e91b83638ad2bd0D2F9efC6f65b5"
      },
      {
        "endpoint": "https://audius-creator-10.theblueprint.xyz",
        "delegateOwnerWallet": "0x97BcBFA8289731d694440795094E831599Ab7A11"
      },
      {
        "endpoint": "https://audius-creator-11.theblueprint.xyz",
        "delegateOwnerWallet": "0xfe38c5Ea3579c9333fE302414fe1895F7a320beF"
      },
      {
        "endpoint": "https://audius-creator-12.theblueprint.xyz",
        "delegateOwnerWallet": "0x8C78ef541135e2cb037f91109fb8EE780fa4709d"
      },
      {
        "endpoint": "https://audius-creator-13.theblueprint.xyz",
        "delegateOwnerWallet": "0x75D2269D18C59CC2ED00a63a40367AC495E3F330"
      }
    ],
    "antiAbuseOracleNodes": {
      "endpoints": [
        "https://discoveryprovider.audius.co",
        "https://audius-oracle.creatorseed.com",
        "https://oracle.audius.endl.net"
      ],
      "registeredAddresses": [
        "0x9811BA3eAB1F2Cd9A2dFeDB19e8c2a69729DC8b6",
        "0xe60d50356cd891f56B744165fcc1D8B352201A76",
        "0x7A03cFAE79266683D9706731D6E187868E939c9C"
      ]
    },
    "identityService": "https://identityservice.audius.co"
  },
  "acdc": {
    "entityManagerContractAddress": "0x1Cd8a543596D499B9b6E7a6eC15ECd2B7857Fd64",
    "chainId": 31524
  },
  "solana": {
    "claimableTokensProgramAddress": "Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ",
    "rewardManagerProgramAddress": "DDZDcYdQFEMwcu2Mwo75yGFjJ1mUQyyXLWzhZLEVFcei",
    "rewardManagerStateAddress": "71hWFVYokLaN1PNYzTAWi13EfJ7Xt9VbSWUKsXUT8mxE",
    "paymentRouterProgramAddress": "paytYpX3LPN98TAeen6bFFeraGSuWnomZmCXjAsoqPa",
    "stakingBridgeProgramAddress": "stkB5DZziVJT1C1VmzvDdRtdWxfs5nwcHViiaNBDK31",
    "rpcEndpoint": "https://audius-fe.rpcpool.com",
    "usdcTokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "wAudioTokenMint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
    "bonkTokenMint": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    "rewardManagerLookupTableAddress": "4UQwpGupH66RgQrWRqmPM9Two6VJEE68VZ7GeqZ3mvVv"
  },
  "ethereum": {
    "rpcEndpoint": "https://eth-client.audius.co",
    "addresses": {
      "ethRewardsManagerAddress": "0x5aa6B99A2B461bA8E97207740f0A689C5C39C3b0",
      "serviceProviderFactoryAddress": "0xD17A9bc90c582249e211a4f4b16721e7f65156c8",
      "serviceTypeManagerAddress": "0x9EfB0f4F38aFbb4b0984D00C126E97E21b8417C5",
      "audiusTokenAddress": "0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998",
      "audiusWormholeAddress": "0x6E7a1F7339bbB62b23D44797b63e4258d283E095",
      "delegateManagerAddress": "0x4d7968ebfD390D5E7926Cb3587C39eFf2F9FB225",
      "stakingAddress": "0xe6D97B2099F142513be7A2a068bE040656Ae4591"
    }
  }
}
