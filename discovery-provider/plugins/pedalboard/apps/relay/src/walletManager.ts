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
    private lockableWallets: LockableWallet[]

    constructor(wallets: string) {
        const parsedWallets = parseRelayerWallets(wallets)
        if (parsedWallets.length === 0) throw new Error("No relay wallets configured")
        const lockableWallets = parsedWallets.map((wallet) => ({ wallet, locked: false, lockExpiration: undefined }))
        this.lockableWallets = lockableWallets
    }
    
    // randomly select next available wallet
    async selectNextWallet(): Promise<RelayerWallet> {
        const unlockedWallets = this.lockableWallets.filter((wallet) => !wallet.locked)
        const randomIndex = Math.floor(Math.random() * unlockedWallets.length)
        const wallet = unlockedWallets[randomIndex].wallet
        this.lock({ publicKey: wallet.publicKey })
        return wallet
    }

    lock({ publicKey }: { publicKey: string}) {
        const lockableWalletIndex = this.lockableWallets.findIndex((wallet) => wallet.wallet.publicKey === publicKey)
        if (lockableWalletIndex === -1) throw new Error("Attempting to lock wallet that doesn't exist")
        const lockableWallet = this.lockableWallets[lockableWalletIndex]
        // five minutes in the future
        const expiration = new Date(new Date().getTime() + 5 * 60000);
        this.lockableWallets[lockableWalletIndex] = { locked: true, lockExpiration: expiration, wallet: lockableWallet.wallet }
    }

    release({ publicKey } : { publicKey: string } ) {
        const lockableWalletIndex = this.lockableWallets.findIndex((wallet) => wallet.wallet.publicKey === publicKey)
        if (lockableWalletIndex === -1) throw new Error("Attempting to release wallet that doesn't exist")
        const lockableWallet = this.lockableWallets[lockableWalletIndex]
        this.lockableWallets[lockableWalletIndex] = { locked: false, lockExpiration: undefined, wallet: lockableWallet.wallet }
    }

    releaseTimedOutWallets() {
        for (const lockableWallet of this.lockableWallets) {
            const { locked, lockExpiration, wallet } = lockableWallet
            if (locked && lockExpiration) {
                // expiration date has passed
                if (new Date() > lockExpiration) {
                    this.release({ publicKey: wallet.publicKey })
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
