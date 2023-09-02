import { logger } from "./logger";
import { Wallet, providers } from "ethers";

export class WalletManager {
  private walletQueue: Wallet[];
  private web3: providers.JsonRpcProvider;

  constructor(web3: providers.JsonRpcProvider) {
    this.web3 = web3;
    this.walletQueue = this.generateWallets();
  }

  // picks next wallet from the top and rotates it to the back
  selectNextWallet(): Wallet {
    const nextWallet = this.walletQueue.shift();
    if (nextWallet === undefined) {
      // should be impossible since we requeue the wallet
      logger.warn("wallet queue is empty, regenerating");
      this.walletQueue = this.generateWallets();
      return this.selectNextWallet();
    }
    this.walletQueue.push(nextWallet);
    return nextWallet;
  }

  // external function for holders of the class to refresh wallets for whatever reason
  regenerateAllWallets() {
    this.walletQueue = this.generateWallets();
  }

  private generateWallets(): Wallet[] {
    return [...Array(10).keys()].map((_) =>
      Wallet.createRandom().connect(this.web3)
    );
  }
}
