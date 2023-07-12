import { App } from "basekit/src"
import { SharedData } from "."
import { logger } from "./logger"

export type RelayerWallet = {
    publicKey: string,
    privateKey: string,
}

type LockableWallet = {
    wallet: RelayerWallet,
    locked: boolean,
    lockExpiration: Date | undefined
}

export class WalletManager {
    // pubKey => LockableWallet
    private lockableWallets: Map<string, LockableWallet>

    constructor(wallets: string) {
        const parsedWallets = parseRelayerWallets(wallets)
        if (parsedWallets.length === 0) throw new Error("No relay wallets configured")
        const lockableWallets = new Map<string, LockableWallet>()
        for (const wallet of parsedWallets) {
            lockableWallets.set(wallet.publicKey, { wallet, locked: false, lockExpiration: undefined })
        }
        this.lockableWallets = lockableWallets
    }
    
    // randomly select next available wallet
    async selectNextWallet(): Promise<RelayerWallet> {
        const unlockedWallets = Array.from(this.lockableWallets).filter(([_, wallet]) => !wallet.locked)
        const randomIndex = Math.floor(Math.random() * unlockedWallets.length)
        return unlockedWallets[randomIndex][1].wallet
    }

    release({ publicKey } : { publicKey: string } ) {
        const lockableWallet = this.lockableWallets.get(publicKey)
        if (lockableWallet === undefined) throw new Error("Attempting to release wallet that doesn't exist")
        const wallet = lockableWallet.wallet
        if (wallet === undefined) throw new Error("Wallet in lockable wallet is undefined")
        this.lockableWallets.set(publicKey, { wallet, locked: false, lockExpiration: undefined })
    }

    releaseTimedOutWallets() {
        for (const [pubKey, lockableWallet] of this.lockableWallets) {
            const { locked, lockExpiration } = lockableWallet
            if (locked && lockExpiration) {
                // expiration date has passed
                if (new Date() > lockExpiration) {
                    const lockableWallet = this.lockableWallets.get(pubKey)
                    if (lockableWallet === undefined) throw new Error("Attempting to release wallet that doesn't exist")
                    const wallet = lockableWallet.wallet
                    if (wallet === undefined) throw new Error("Wallet in lockable wallet is undefined")
                    this.lockableWallets.set(pubKey, { wallet, locked: false, lockExpiration: undefined })
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
    logger.info("released expired wallet locks")
}

// expects a string of the format '[{"privateKey": "", "publicKey": ""}, ...]' and parses it into
// a typesafe array of RelayerWallet
export const parseRelayerWallets = (relayerWalletsStr: string): RelayerWallet[] => {
    return JSON.parse(relayerWalletsStr) as RelayerWallet[]
}
