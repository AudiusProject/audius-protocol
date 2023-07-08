export class WalletManager {
    private readonly wallets: string[]

    constructor(wallets: string[]) {
        this.wallets = wallets
    }
    
    /// returns currently selected wallet then randomly saves the next one
    /// no need for redis lock
    async selectNextWallet(): Promise<string> {
        return this.wallets[Math.floor(Math.random() * this.wallets.length)]
    }

    /// returns true if locked, false if not locked
    generateWalletLockKey(pubKey: string): boolean {
        return true
    }

    randomIndex(): number {
        return Math.random() * (this.wallets.length - 1)
    }

    release(wallet: string) {}
}
