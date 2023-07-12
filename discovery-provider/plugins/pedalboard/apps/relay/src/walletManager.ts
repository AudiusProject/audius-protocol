import { App } from "basekit/src"
import { SharedData } from "."

type LockableWallet = {
    wallet: string,
    locked: boolean,
    lockExpiration: Date | undefined
}

export class WalletManager {
    private lockableWallets: Map<string, LockableWallet>

    constructor(wallets: string[]) {
        const lockableWallets = new Map()
        for (const wallet of wallets) {
            lockableWallets.set(wallet, { wallet, locked: false, lockExpiration: undefined })
        }
        this.lockableWallets = lockableWallets
    }
    
    // randomly select next available wallet
    async selectNextWallet(): Promise<string> {
        const unlockedWallets = Array.from(this.lockableWallets).filter(([_, wallet]) => !wallet.locked)
        const randomIndex = Math.floor(Math.random() * unlockedWallets.length)
        return unlockedWallets[randomIndex][0]
    }

    release(wallet: string) {
        this.lockableWallets.set(wallet, { wallet, locked: false, lockExpiration: undefined })
    }

    releaseTimedOutWallets() {
        for (const [wallet, lockableWallet] of this.lockableWallets) {
            const { locked, lockExpiration } = lockableWallet
            if (locked && lockExpiration) {
                // expiration date has passed
                if (new Date() > lockExpiration) {
                    this.lockableWallets.set(wallet, { wallet, locked: false, lockExpiration: undefined })
                }
            }
        }
    }
}

// runs on an interval and releases any wallets that are left locked
// and hit their timeout
export const releaseWallets = async (app: App<SharedData>) => {
    const { wallets } = app.viewAppData()
    wallets.releaseTimedOutWallets()
}
