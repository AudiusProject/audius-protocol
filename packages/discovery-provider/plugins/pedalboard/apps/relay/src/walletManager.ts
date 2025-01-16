import { config } from '.'
import { logger } from './logger'
import { Wallet, providers } from 'ethers'

const localDevWallets = [
  '4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
  '6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1',
  '6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c',
  '646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913',
  'add53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743',
  '395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd',
  'e485d098507f54e7733a205420dfddbe58db035fa577fc294ebd14db90767a52',
  'a453611d9419d0e56f499079478fd72c37b251a94bfde4d19872c44cf65386e3',
  '829e924fdf021ba3dbbc4225edfece9aca04b929d6e75613329ca6f1d31c0bb4',
  'b0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773',
  '77c5495fbb039eed474fc940f29955ed0531693cc9212911efd35dff0373153f',
  'd99b5b29e6da2528bf458b26237a6cf8655a3e3276c1cdc0de1f98cefee81c01',
  '9b9c613a36396172eab2d34d72331c8ca83a358781883a535d2941f66db07b24',
  '0874049f95d55fb76916262dc70571701b5c4cc5900c0691af75f1a8a52c8268',
  '21d7212f3b4e5332fd465877b64926e3532653e2798a11255a46f533852dfe46',
  '47b65307d0d654fd4f786b908c04af8fface7710fc998b37d219de19c39ee58c',
  '66109972a14d82dbdb6894e61f74708f26128814b3359b64f8b66565679f7299',
  '2eac15546def97adc6d69ca6e28eec831189baa2533e7910755d15403a0749e8',
  '2e114163041d2fb8d45f9251db259a68ee6bdbfd6d10fe1ae87c5c4bcd6ba491',
  'ae9a2e131e9b359b198fa280de53ddbe2247730b881faae7af08e567e58915bd',
  'd09ba371c359f10f22ccda12fd26c598c7921bda3220c9942174562bc6a36fe8',
  '2d2719c6a828911ed0c50d5a6c637b63353e77cf57ea80b8e90e630c4687e9c5',
  'd353907ab062133759f149a3afcb951f0f746a65a60f351ba05a3ebf26b67f5c',
  '971c58af72fd8a158d4e654cfbe98f5de024d28547005909684f58c9c46a25c4',
  '85d168288e7fcf84b1841e447fc7945b1e27bfe9a3776367079a6427405eac66',
  'f3da3ac70552606ed09d16dd2808c924826094f0c5cbfcb4f2e0e1cfc70ff8dd',
  'bf20e9c05d70ce59a6b125eab3b4122eb75044a33749c4c5a77e3b0b86fa091e',
  '647442126fdb80c6aec75a0d75a6fe1b31a4e204d29a2c446f550c4115cac139',
  'ef78746d079c9d72d2e9a3c10447d1d4aaae6a51541d0296da4fc9ec7e060aff',
  'c95286117cd74213417aeca52118ccd03ec240582f0a9a3e4ef7b434523179f3',
  '21118f9a6de181061a2abd549511105adb4877cf9026f271092e6813b7cf58ab',
  '1166189cdf129cdcb011f2ad0e5be24f967f7b7026d162d7c36073b12020b61c',
  '1aa14c63d481dcc1185a654eb52c9c0749d07ac8f30ef17d45c3c391d9bf68eb',
  '4a23fe455a34bb47f8f3282a4f6d36c22987275f0bb9aacb251568df7d038385',
  '2450bb2893d0bddf92f4ac88cb65a8e94b56e89f7ec3e46c9c88b2b46ebe3ca5',
  'f934aded8693d6b2b61ccbb3bc1f86a86afbbd8622a5eb3401b2f8de9863b07b',
  'c8eea9d162fe9d6852afa0d55ebe6b14b8e6fc9b0e93ae13209e2b4db48a6482',
  'be146cdb15d4069e0249da35c928819cbde563dd4fe3d1ccfeda7885a52e0754',
  '74ae0c3d566d7e73613d4ebb814b0f37a2d040060814f75e115d28469d22f4c2',
  'b2b19df163d1f952df31e32c694d592e530c0b3d54c6276015bc9b0acaf982de',
  '86117111fcb34df8d0e58505969021b9308513c6e94d16172f0c8789a7130a43',
  'dcb8686c211c231be763f0a95cc02227a707643fd2631bda99fcdbd03cd9ca3d',
  'b74ffec4abd7e93889196054d5e6ed8ea9c1c3314e77a74c00f851c47f5268fd',
  'ba30972105ec13423116d2e5c11a8d282805ac3654bb4c1c2f5fa63f4da42dad',
  '87ad1798a2d32434f72598575237528a435416da1bdc900025c415903647957e',
  '5d4af11a54d4a5196b0073ba26a1114cb113e1339d9354c8165b8e181c89cad9',
  'a03bf2b145b0154c2e788a1d4642d235f6ff1c8aceeb41d0d7232525da8bdb77',
  'b1f4063952ebc0785bbc201520ed7f0c5fc15298099e60e62f8cfa456bbc2705',
  '41d647879d53baddb93cfadc3f5ef4d5bdc330bec4b4ef9caace19c70a385856',
  '87c546d6cb8ec705bea47e2ab40f42a768b1e5900686b0cecc68c0e8b74cd789'
]

export class WalletManager {
  private walletQueue: Wallet[]
  private web3: providers.JsonRpcProvider

  constructor(web3: providers.JsonRpcProvider) {
    this.web3 = web3
    this.walletQueue = this.generateWallets()
  }

  // picks next wallet from the top and rotates it to the back
  selectNextWallet(): Wallet {
    const nextWallet = this.walletQueue.shift()
    if (nextWallet === undefined) {
      // should be impossible since we requeue the wallet
      logger.warn('wallet queue is empty, regenerating')
      this.walletQueue = this.generateWallets()
      return this.selectNextWallet()
    }
    this.walletQueue.push(nextWallet)
    return nextWallet
  }

  // external function for holders of the class to refresh wallets for whatever reason
  regenerateAllWallets() {
    this.walletQueue = this.generateWallets()
  }

  private generateWallets(): Wallet[] {
    if (config.environment === 'dev') {
      logger.info('generating from hardcoded priv keys in dev mode')
      return localDevWallets.map((wallet) =>
        new Wallet(wallet).connect(this.web3)
      )
    }
    return [...Array(200).keys()].map((_) =>
      Wallet.createRandom().connect(this.web3)
    )
  }
}
