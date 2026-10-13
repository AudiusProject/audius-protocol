import { wAUDIO, type AudioWei } from '@audius/fixed-decimal'
import type { AudiusSdkWithServices } from '@audius/sdk'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError
} from '@solana/spl-token'
import { Connection, PublicKey } from '@solana/web3.js'

import type { Env } from '~/services/env'

import type { MintName } from './solana'

/**
 * Solana-specific parts of the AudiusBackend. Kept in their own module so
 * @solana/web3.js and @solana/spl-token are only loaded when one of these
 * methods is first used.
 */
export const createSolanaBackend = ({
  env,
  reportError
}: {
  env: Env
  reportError: (args: { error: Error }) => void | Promise<void>
}) => {
  function getMintAddress(mint: MintName): PublicKey {
    // Simple mapping for the fixed set of mint names
    const mintAddresses: Record<MintName, string> = {
      wAUDIO: env.WAUDIO_MINT_ADDRESS,
      USDC: env.USDC_MINT_ADDRESS
    }

    const address = mintAddresses[mint]
    if (!address) {
      throw new Error(`Token address not found for mint: ${mint}`)
    }
    return new PublicKey(address)
  }

  /**
   * Fetches the Sol balance for the given wallet address
   * @param {string} The solana wallet address
   * @returns {Promise<AudioWei>}
   */
  async function getAddressSolBalance({
    address,
    sdk
  }: {
    address: string
    sdk: AudiusSdkWithServices
  }): Promise<AudioWei> {
    try {
      const addressPubKey = new PublicKey(address)
      const connection = sdk.services.solanaClient.connection
      const solBalance = await connection.getBalance(addressPubKey)
      return BigInt(solBalance ?? 0) as AudioWei
    } catch (e) {
      reportError({ error: e as Error })
      return BigInt(0) as AudioWei
    }
  }

  async function createAssociatedTokenAccountWithPhantom(
    connection: Connection,
    address: string,
    mint: PublicKey,
    sdk: AudiusSdkWithServices
  ) {
    if (!window.phantom) {
      throw new Error(
        'Recipient has no $AUDIO token account. Please install Phantom-Wallet to create one.'
      )
    }

    if (!window.solana.isConnected) {
      await window.solana.connect()
    }

    const newAccountKey = new PublicKey(address)
    const phantomWalletKey = window.solana.publicKey
    if (!phantomWalletKey) {
      throw new Error('Failed to resolve Phantom wallet')
    }

    const feePayer = new PublicKey(phantomWalletKey.toString())

    const associatedTokenAddress = findAssociatedTokenAddress({
      solanaWalletKey: newAccountKey,
      mint
    })

    const instruction = createAssociatedTokenAccountIdempotentInstruction(
      feePayer,
      associatedTokenAddress,
      newAccountKey,
      mint
    )

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash('confirmed')

    const tx = await sdk.services.solanaClient.buildTransaction({
      instructions: [instruction],
      recentBlockhash: blockhash,
      feePayer
    })

    const { signature } = await window.solana.signAndSendTransaction(tx)
    if (!signature) {
      throw new Error('Phantom failed to sign and send transaction')
    }
    await connection.confirmTransaction({
      signature: signature!.toString(),
      lastValidBlockHeight,
      blockhash
    })

    return associatedTokenAddress
  }

  /** Gets associated token account info for the passed account, deriving the associated address
   * if necessary. If the account doesn't exist, it will attempt to create it using the user's
   * browser wallet.
   */
  async function getOrCreateAssociatedTokenAccount({
    address,
    sdk,
    mint
  }: {
    address: string
    sdk: AudiusSdkWithServices
    mint: PublicKey
  }) {
    const connection = sdk.services.solanaClient.connection
    const pubkey = new PublicKey(address)
    try {
      const account = await getAccount(connection, pubkey)
      return account.address
    } catch (err) {
      // Account is not a valid token account (either doesn't exist or wrong owner).
      // Assume it's a wallet address and derive the associated token account from it.
      if (
        err instanceof TokenInvalidAccountOwnerError ||
        err instanceof TokenAccountNotFoundError
      ) {
        console.info(
          'Provided recipient solana address was not a token account. Assuming root account.'
        )
        const associatedTokenAccount = findAssociatedTokenAddress({
          solanaWalletKey: pubkey,
          mint
        })
        // Atempt to get the associated token account
        try {
          const account = await getAccount(connection, associatedTokenAccount)
          return account.address
        } catch (err) {
          // If it's not a valid token account, attempt to create it
          if (err instanceof TokenAccountNotFoundError) {
            // We do not want to relay gas fees for this token account creation,
            // so we ask the user to create one with phantom, showing an error
            // if phantom is not found.
            return createAssociatedTokenAccountWithPhantom(
              connection,
              address,
              mint,
              sdk
            )
          }
          throw err
        }
      }
      // Other error (including non-existent account)
      throw err
    }
  }

  /**
   * Make a request to send solana tokens
   */
  async function sendTokens({
    address,
    amount,
    ethAddress,
    sdk,
    mint,
    recipientEthAddress
  }: {
    address: string
    amount: AudioWei
    ethAddress: string
    sdk: AudiusSdkWithServices
    mint: PublicKey
    recipientEthAddress?: string // When provided, derives user-bank ATA for the recipient
  }) {
    if (recipientEthAddress) {
      // When sending to a user by ETH address, derive their user bank and
      // combine account creation (if needed) + transfer in a single tx.
      const { userBank, instructions: createInstructions } =
        await sdk.services.claimableTokensClient.createUserBankIfNeededInstruction(
          {
            ethWallet: recipientEthAddress,
            mint: mint as any
          }
        )

      const res = await transferTokens({
        destination: userBank,
        amount,
        ethAddress,
        sdk,
        mint,
        prefixInstructions: createInstructions
      })
      return { res, error: null }
    } else {
      // When sending to a Solana wallet address directly, use regular ATA logic
      const tokenAccountAddress = await getOrCreateAssociatedTokenAccount({
        address,
        sdk,
        mint
      })

      const res = await transferTokens({
        destination: tokenAccountAddress,
        amount,
        ethAddress,
        sdk,
        mint
      })
      return { res, error: null }
    }
  }

  async function transferTokens({
    ethAddress,
    destination,
    amount,
    sdk,
    mint,
    prefixInstructions = []
  }: {
    ethAddress: string
    destination: PublicKey
    amount: AudioWei
    sdk: AudiusSdkWithServices
    mint: MintName | PublicKey
    prefixInstructions?: import('@solana/web3.js').TransactionInstruction[]
  }) {
    console.info(
      `Transferring ${amount.toString()} tokens with mint ${mint} to ${destination.toBase58()}`
    )

    const secpTransactionInstruction =
      await sdk.services.claimableTokensClient.createTransferSecpInstruction({
        amount,
        ethWallet: ethAddress,
        mint,
        destination,
        instructionIndex: prefixInstructions.length
      })
    const transferInstruction =
      await sdk.services.claimableTokensClient.createTransferInstruction({
        ethWallet: ethAddress,
        mint,
        destination
      })

    // Fetch blockhash explicitly to provide better error handling
    let recentBlockhash: string
    try {
      const { blockhash } =
        await sdk.services.solanaClient.connection.getLatestBlockhash()
      recentBlockhash = blockhash
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      if (
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('network') ||
        errorMessage.includes('Failed to fetch')
      ) {
        throw new Error(
          'Failed to connect to Solana network. Please check your internet connection and try again.'
        )
      }
      throw new Error(`Failed to get recent blockhash: ${errorMessage}`)
    }

    const transaction = await sdk.services.solanaClient.buildTransaction({
      instructions: [
        ...prefixInstructions,
        secpTransactionInstruction,
        transferInstruction
      ],
      recentBlockhash
    })
    const signature =
      await sdk.services.claimableTokensClient.sendTransaction(transaction)
    return signature
  }

  /**
   * Fetches the SPL WAUDIO balance for the user's solana wallet address
   * @param {string} The solana wallet address
   * @returns {Promise<wAUDIO | null>} Returns the balance, 0 for non-existent token accounts
   */
  async function getAddressWAudioBalance({
    address,
    sdk
  }: {
    address: string
    sdk: AudiusSdkWithServices
  }) {
    try {
      const { amount } = await getAssociatedTokenAccountInfo({
        address,
        sdk
      })
      return wAUDIO(amount).value
    } catch (err) {
      // Non-existent token accounts indicate 0 balance. Other errors fall through
      if (err instanceof TokenAccountNotFoundError) {
        return wAUDIO(0).value
      }
      throw err
    }
  }

  /**
   * Finds the associated token address given a solana wallet public key
   * @param solanaWalletKey Public Key for a given solana account (a wallet)
   * @param mintKey
   * @returns token account public key
   */
  function findAssociatedTokenAddress({
    solanaWalletKey,
    mint
  }: {
    solanaWalletKey: PublicKey
    mint: MintName | PublicKey
  }) {
    const solanaTokenProgramKey = new PublicKey(TOKEN_PROGRAM_ID)
    const mintKey = mint instanceof PublicKey ? mint : getMintAddress(mint)
    const addresses = PublicKey.findProgramAddressSync(
      [
        solanaWalletKey.toBuffer(),
        solanaTokenProgramKey.toBuffer(),
        mintKey.toBuffer()
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
    return addresses[0]
  }

  /** Gets associated token account info for the passed account. It will
   * first check if `address` ia a token account. If not, it will assume
   * it is a root account and attempt to derive an associated token account from it.
   */
  async function getAssociatedTokenAccountInfo({
    address,
    sdk,
    mint = 'wAUDIO'
  }: {
    address: string
    sdk: AudiusSdkWithServices
    mint?: MintName | PublicKey
  }) {
    const connection = sdk.services.solanaClient.connection
    const pubkey = new PublicKey(address)
    try {
      return await getAccount(connection, pubkey)
    } catch (err) {
      // Account is not a valid token account (either doesn't exist or wrong owner).
      // Assume it's a wallet address and derive the associated token account from it.
      if (
        err instanceof TokenInvalidAccountOwnerError ||
        err instanceof TokenAccountNotFoundError
      ) {
        console.info(
          'Provided recipient solana address was not a token account. Assuming root account.'
        )

        const associatedTokenAccount = findAssociatedTokenAddress({
          solanaWalletKey: pubkey,
          mint
        })
        return await getAccount(connection, associatedTokenAccount)
      }
      // Other error (including non-existent account)
      throw err
    }
  }

  return {
    findAssociatedTokenAddress,
    getAddressSolBalance,
    getAddressWAudioBalance,
    getAssociatedTokenAccountInfo,
    sendTokens
  }
}

export type SolanaBackend = ReturnType<typeof createSolanaBackend>
