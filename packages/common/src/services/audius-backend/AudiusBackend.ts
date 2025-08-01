import { AUDIO, AudioWei, wAUDIO } from '@audius/fixed-decimal'
import type { LocalStorage } from '@audius/hedgehog'
import { AudiusSdk, Id, HedgehogWalletNotFoundError } from '@audius/sdk'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  TOKEN_PROGRAM_ID,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError
} from '@solana/spl-token'
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
  VersionedTransaction
} from '@solana/web3.js'
import { getAddress } from 'viem'

import { userMetadataToSdk } from '~/adapters/user'
import { Env } from '~/services/env'
import dayjs from '~/utils/dayjs'

import {
  ID,
  InstagramUser,
  TikTokUser,
  ComputedUserProperties,
  WriteableUserMetadata
} from '../../models'
import { AnalyticsEvent } from '../../models/Analytics'
import { ReportToSentryArgs } from '../../models/ErrorReporting'
import * as schemas from '../../schemas'
import {
  FeatureFlags,
  RemoteConfigInstance
} from '../../services/remote-config'
import {
  BrowserNotificationSetting,
  PushNotificationSetting,
  PushNotifications
} from '../../store'
import { getErrorMessage, uuid, Maybe, Nullable } from '../../utils'
import { getTokenBySymbol } from '../tokens'

import { MintName } from './solana'
import { MonitoringCallbacks } from './types'

type DisplayEncoding = 'utf8' | 'hex'
type PhantomEvent = 'disconnect' | 'connect' | 'accountChanged'
type PhantomRequestMethod =
  | 'connect'
  | 'disconnect'
  | 'signTransaction'
  | 'signAllTransactions'
  | 'signMessage'

interface ConnectOpts {
  onlyIfTrusted: boolean
}
export interface PhantomProvider {
  publicKey: PublicKey | null
  isConnected: boolean | null
  isPhantom: boolean
  signTransaction: (transaction: Transaction) => Promise<Transaction>
  signAndSendTransaction: (
    transaction: Transaction | VersionedTransaction
  ) => Promise<Transaction>
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>
  disconnect: () => Promise<void>
  on: (event: PhantomEvent, handler: (args: any) => void) => void
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>
}
declare global {
  interface Window {
    web3Loaded: boolean
    phantom: any
    solana: PhantomProvider
    Web3: any
  }
}

export const AuthHeaders = Object.freeze({
  Message: 'Encoded-Data-Message',
  Signature: 'Encoded-Data-Signature'
})

const unauthenticatedUuid = uuid()

export type TransactionReceipt = { blockHash: string; blockNumber: number }

type DiscoveryProviderListener = (endpoint: Nullable<string>) => void

type AudiusBackendSolanaConfig = Partial<{
  claimableTokenPda: string
  claimableTokenProgramAddress: string
  rewardsManagerProgramId: string
  rewardsManagerProgramPda: string
  rewardsManagerTokenPda: string
  paymentRouterProgramId: string
  solanaClusterEndpoint: string
  solanaFeePayerAddress: string
  solanaTokenAddress: string
  waudioMintAddress: string
  usdcMintAddress: string
  wormholeAddress: string
}>

type AudiusBackendParams = {
  claimDistributionContractAddress: Maybe<string>
  env: Env
  ethOwnerWallet: Maybe<string>
  ethProviderUrls: Maybe<string[]>
  ethRegistryAddress: Maybe<string>
  ethTokenAddress: Maybe<string>
  getFeatureEnabled: (
    flag: FeatureFlags,
    fallbackFlag?: FeatureFlags
  ) => Promise<boolean | null> | null | boolean
  getHostUrl: () => Nullable<string>
  identityServiceUrl: Maybe<string>
  generalAdmissionUrl: Maybe<string>
  isElectron: Maybe<boolean>
  localStorage?: LocalStorage
  monitoringCallbacks: MonitoringCallbacks
  nativeMobile: Maybe<boolean>
  recaptchaSiteKey: Maybe<string>
  recordAnalytics: (event: AnalyticsEvent, callback?: () => void) => void
  reportError: ({
    level,
    additionalInfo,
    error,
    name
  }: ReportToSentryArgs) => void | Promise<void>
  registryAddress: Maybe<string>
  entityManagerAddress: Maybe<string>
  remoteConfigInstance: RemoteConfigInstance
  setLocalStorageItem: (key: string, value: string) => Promise<void>
  solanaConfig: AudiusBackendSolanaConfig
}

export const audiusBackend = ({
  identityServiceUrl,
  generalAdmissionUrl,
  nativeMobile,
  reportError,
  env
}: AudiusBackendParams) => {
  const currentDiscoveryProvider: Nullable<string> = null
  const didSelectDiscoveryProviderListeners: DiscoveryProviderListener[] = []

  function addDiscoveryProviderSelectionListener(
    listener: DiscoveryProviderListener
  ) {
    didSelectDiscoveryProviderListeners.push(listener)
    if (currentDiscoveryProvider !== null) {
      listener(currentDiscoveryProvider)
    }
  }

  function getMintAddress(mint: MintName): PublicKey {
    const token = getTokenBySymbol(env, mint)
    if (!token) {
      throw new Error(`Token not found: ${mint}`)
    }
    return new PublicKey(token.address)
  }

  async function recordTrackListen({
    userId,
    trackId,
    sdk
  }: {
    userId: ID
    trackId: ID
    sdk: AudiusSdk
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      await fetch(`${identityServiceUrl}/tracks/${trackId}/listen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({
          userId: userId ?? unauthenticatedUuid,
          solanaListen: true
        })
      })
    } catch (err) {
      console.error(getErrorMessage(err))
    }
  }

  async function updateCreator({
    metadata,
    sdk
  }: {
    metadata: WriteableUserMetadata &
      Pick<
        ComputedUserProperties,
        'updatedProfilePicture' | 'updatedCoverPhoto'
      >
    sdk: AudiusSdk
  }) {
    let newMetadata = { ...metadata }
    try {
      newMetadata = schemas.newUserMetadata(newMetadata, true)
      const userId = newMetadata.user_id
      const { blockHash, blockNumber } = await sdk.users.updateProfile({
        userId: Id.parse(userId),
        profilePictureFile: metadata.updatedProfilePicture?.file,
        coverArtFile: metadata.updatedCoverPhoto?.file,
        metadata: userMetadataToSdk(newMetadata)
      })
      return { blockHash, blockNumber, userId }
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  async function instagramHandle(handle: string) {
    try {
      const res = await fetch(
        `${generalAdmissionUrl}/social/instagram/${handle}`
      )
      const json: InstagramUser = await res.json()
      return json
    } catch (error) {
      console.error(error)
      return null
    }
  }

  async function tiktokHandle(handle: string) {
    try {
      const res = await fetch(`${generalAdmissionUrl}/social/tiktok/${handle}`)
      const json: TikTokUser = await res.json()
      return json
    } catch (error) {
      console.error(error)
      return null
    }
  }

  async function clearNotificationBadges({ sdk }: { sdk: AudiusSdk }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(`${identityServiceUrl}/notifications/clear_badges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        }
      }).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  async function getEmailNotificationSettings({ sdk }: { sdk: AudiusSdk }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      const res = await fetch(`${identityServiceUrl}/notifications/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        }
      }).then((res) => res.json())
      return res
    } catch (e) {
      console.error(e)
    }
  }

  async function updateEmailNotificationSettings({
    sdk,
    emailFrequency,
    userId
  }: {
    sdk: AudiusSdk
    emailFrequency: string
    userId: ID
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      const res = await fetch(
        `${identityServiceUrl}/notifications/settings?user_id=${userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          },
          body: JSON.stringify({ settings: { emailFrequency } })
        }
      ).then((res) => res.json())
      return res
    } catch (e) {
      console.error(e)
    }
  }

  async function updateNotificationSettings({
    sdk,
    settings
  }: {
    sdk: AudiusSdk
    settings: Partial<Record<BrowserNotificationSetting, boolean>>
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(
        `${identityServiceUrl}/push_notifications/browser/settings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          },
          body: JSON.stringify({ settings })
        }
      ).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  async function updatePushNotificationSettings({
    sdk,
    settings
  }: {
    sdk: AudiusSdk
    settings: Partial<Record<PushNotificationSetting, boolean>>
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(`${identityServiceUrl}/push_notifications/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ settings })
      }).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  async function signData({ sdk, data }: { sdk: AudiusSdk; data: string }) {
    try {
      const signature = await sdk.services.audiusWalletClient.signMessage({
        message: data
      })
      return { data, signature }
    } catch (e) {
      // Don't log an error for HedgehogWalletNotFoundError as it's expected when user is logged out
      if (!(e instanceof HedgehogWalletNotFoundError)) {
        console.error(e)
        reportError({ error: e as Error })
      }
      return { data, signature: '' }
    }
  }

  async function signGatedContentRequest({ sdk }: { sdk: AudiusSdk }) {
    const data = `Gated content user signature at ${Date.now()}`
    return await signData({ sdk, data })
  }

  async function signIdentityServiceRequest({ sdk }: { sdk: AudiusSdk }) {
    const unixTs = Math.round(new Date().getTime() / 1000) // current unix timestamp (sec)
    const data = `Click sign to authenticate with identity service: ${unixTs}`
    return await signData({ sdk, data })
  }

  async function signDiscoveryNodeRequest({
    sdk,
    input
  }: {
    sdk: AudiusSdk
    input?: any
  }) {
    let data
    if (input) {
      data = input
    } else {
      const unixTs = Math.round(new Date().getTime() / 1000) // current unix timestamp (sec)
      data = `Click sign to authenticate with discovery node: ${unixTs}`
    }
    return await signData({ sdk, data })
  }

  async function getBrowserPushNotificationSettings({
    sdk
  }: {
    sdk: AudiusSdk
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(
        `${identityServiceUrl}/push_notifications/browser/settings`,
        {
          headers: {
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      )
        .then((res) => res.json())
        .then((res) => res.settings)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  async function getBrowserPushSubscription({
    sdk,
    pushEndpoint
  }: {
    sdk: AudiusSdk
    pushEndpoint: string
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      const endpiont = encodeURIComponent(pushEndpoint)
      return await fetch(
        `${identityServiceUrl}/push_notifications/browser/enabled?endpoint=${endpiont}`,
        {
          headers: {
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      )
        .then((res) => res.json())
        .then((res) => res.enabled)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  async function getSafariBrowserPushEnabled({
    sdk,
    deviceToken
  }: {
    sdk: AudiusSdk
    deviceToken: string
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(
        `${identityServiceUrl}/push_notifications/device_token/enabled?deviceToken=${deviceToken}&deviceType=safari`,
        {
          headers: {
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      )
        .then((res) => res.json())
        .then((res) => res.enabled)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  async function updateBrowserNotifications({
    sdk,
    enabled = true,
    subscription
  }: {
    sdk: AudiusSdk
    enabled: boolean
    subscription: PushSubscription
  }) {
    const { data, signature } = await signIdentityServiceRequest({ sdk })
    return await fetch(
      `${identityServiceUrl}/push_notifications/browser/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ enabled, subscription })
      }
    ).then((res) => res.json())
  }

  async function disableBrowserNotifications({
    sdk,
    subscription
  }: {
    sdk: AudiusSdk
    subscription: PushSubscription
  }) {
    const { data, signature } = await signIdentityServiceRequest({ sdk })
    return await fetch(
      `${identityServiceUrl}/push_notifications/browser/deregister`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ subscription })
      }
    ).then((res) => res.json())
  }

  async function getPushNotificationSettings({ sdk }: { sdk: AudiusSdk }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(`${identityServiceUrl}/push_notifications/settings`, {
        headers: {
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        }
      })
        .then((res) => res.json())
        .then((res: { settings: PushNotifications }) => res.settings)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  async function registerDeviceToken({
    sdk,
    deviceToken,
    deviceType
  }: {
    sdk: AudiusSdk
    deviceToken: string
    deviceType: string
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(
        `${identityServiceUrl}/push_notifications/device_token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          },
          body: JSON.stringify({
            deviceToken,
            deviceType
          })
        }
      ).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  async function deregisterDeviceToken({
    sdk,
    deviceToken
  }: {
    sdk: AudiusSdk
    deviceToken: string
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(
        `${identityServiceUrl}/push_notifications/device_token/deregister`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          },
          body: JSON.stringify({
            deviceToken
          })
        }
      ).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  async function updateUserLocationTimezone({ sdk }: { sdk: AudiusSdk }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      const timezone = dayjs.tz.guess()
      const res = await fetch(`${identityServiceUrl}/users/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ timezone })
      }).then((res) => res.json())
      return res
    } catch (e) {
      console.error(e)
    }
  }

  async function sendWelcomeEmail({
    sdk,
    name
  }: {
    sdk: AudiusSdk
    name: string
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(`${identityServiceUrl}/email/welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ name, isNativeMobile: !!nativeMobile })
      }).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  async function updateUserEvent({
    sdk,
    hasSignedInNativeMobile
  }: {
    sdk: AudiusSdk
    hasSignedInNativeMobile: boolean
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      const res = await fetch(`${identityServiceUrl}/userEvents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ hasSignedInNativeMobile })
      }).then((res) => res.json())
      return res
    } catch (e) {
      console.error(e)
    }
  }

  async function updateHCaptchaScore({
    sdk,
    token
  }: {
    sdk: AudiusSdk
    token: string
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(`${identityServiceUrl}/score/hcaptcha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ token })
      }).then((res) => res.json())
    } catch (err) {
      console.error(getErrorMessage(err))
      return { error: true }
    }
  }

  /**
   * Make a request to fetch the eth AUDIO balance of the the user
   * @params {bool} bustCache
   * @params {string} ethAddress - Optional ETH wallet address. Defaults to hedgehog wallet
   * @returns {Promise<AudioWei | null>} balance or null if failed to fetch balance
   */
  async function getBalance({
    ethAddress,
    sdk
  }: {
    ethAddress: string
    sdk: AudiusSdk
  }): Promise<AudioWei | null> {
    if (!ethAddress) return null

    try {
      const checksumWallet = getAddress(ethAddress)
      const balance = await sdk.services.audiusTokenClient.balanceOf({
        account: checksumWallet
      })
      return AUDIO(balance).value
    } catch (e) {
      console.error(e)
      reportError({ error: e as Error })
      return null
    }
  }

  /**
   * Make a request to fetch the sol wrapped audio balance of the the user
   * @params {string} ethAddress - Optional ETH wallet address to derive user bank. Defaults to hedgehog wallet
   * @returns {Promise<AudioWei>} balance or null if failed to fetch balance
   */
  async function getWAudioBalance({
    ethAddress,
    sdk
  }: {
    ethAddress: string
    sdk: AudiusSdk
  }): Promise<AudioWei | null> {
    try {
      const userBank = await sdk.services.claimableTokensClient.deriveUserBank({
        ethWallet: ethAddress,
        mint: 'wAUDIO'
      })
      const connection = sdk.services.solanaClient.connection
      let balance = BigInt(0)
      try {
        const {
          value: { amount }
        } = await connection.getTokenAccountBalance(userBank)
        balance = BigInt(amount)
      } catch (e) {
        console.error(e)
      }
      const ownerWAudioBalance = AUDIO(wAUDIO(balance)).value
      return ownerWAudioBalance
    } catch (e) {
      console.error(e)
      reportError({ error: e as Error })
      return null
    }
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
    sdk: AudiusSdk
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

  /**
   * Make a request to fetch the balance, staked and delegated total of the wallet address
   * @param address The wallet address to fetch the balance for
   * @param bustCache
   * @returns balance or null if error
   */
  async function getAddressTotalStakedBalance(address: string, sdk: AudiusSdk) {
    if (!address) return null

    try {
      const checksumWallet = getAddress(address)
      const [balance, delegatedBalance, stakedBalance] = await Promise.all([
        sdk.services.audiusTokenClient.balanceOf({
          account: checksumWallet
        }),
        sdk.services.delegateManagerClient.getTotalDelegatorStake({
          delegatorAddress: checksumWallet
        }),
        sdk.services.stakingClient.totalStakedFor({
          account: checksumWallet
        })
      ])

      return AUDIO(balance + delegatedBalance + stakedBalance).value
    } catch (e) {
      reportError({ error: e as Error })
      console.error(e)
      return null
    }
  }

  async function createAssociatedTokenAccountWithPhantom(
    connection: Connection,
    address: string
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
    const tx = await getCreateAssociatedTokenAccountTransaction({
      feePayerKey: phantomWalletKey,
      solanaWalletKey: newAccountKey,
      mint: 'wAUDIO',
      solanaTokenProgramKey: new PublicKey(TOKEN_PROGRAM_ID),
      connection
    })
    const { signature, lastValidBlockHeight, recentBlockhash } =
      await window.solana.signAndSendTransaction(tx)
    if (!signature || !lastValidBlockHeight || !recentBlockhash) {
      throw new Error('Phantom failed to sign and send transaction')
    }
    await connection.confirmTransaction({
      signature: signature.toString(),
      lastValidBlockHeight,
      blockhash: recentBlockhash
    })
    return getAccount(connection, newAccountKey)
  }

  /** Gets associated token account info for the passed account, deriving the associated address
   * if necessary. If the account doesn't exist, it will attempt to create it using the user's
   * browser wallet.
   */
  async function getOrCreateAssociatedTokenAccountInfo({
    address,
    sdk
  }: {
    address: string
    sdk: AudiusSdk
  }) {
    const connection = sdk.services.solanaClient.connection
    const pubkey = new PublicKey(address)
    try {
      return await getAccount(connection, pubkey)
    } catch (err) {
      // Account exists but is not a token account. Assume it's a root account
      // and try to derive an associated account from it.
      if (err instanceof TokenInvalidAccountOwnerError) {
        console.info(
          'Provided recipient solana address was not a token account. Assuming root account.'
        )
        const associatedTokenAccount = findAssociatedTokenAddress({
          solanaWalletKey: pubkey,
          mint: 'wAUDIO'
        })
        // Atempt to get the associated token account
        try {
          return await getAccount(connection, associatedTokenAccount)
        } catch (err) {
          // If it's not a valid token account, attempt to create it
          if (err instanceof TokenAccountNotFoundError) {
            // We do not want to relay gas fees for this token account creation,
            // so we ask the user to create one with phantom, showing an error
            // if phantom is not found.
            return createAssociatedTokenAccountWithPhantom(connection, address)
          }
          throw err
        }
      }
      // Other error (including non-existent account)
      throw err
    }
  }

  /**
   * Make a request to send solana wrapped audio
   */
  async function sendWAudioTokens({
    address,
    amount,
    ethAddress,
    sdk
  }: {
    address: string
    amount: AudioWei
    ethAddress: string
    sdk: AudiusSdk
  }) {
    // TODO: Verify mint is wAUDIO
    const tokenAccountInfo = await getOrCreateAssociatedTokenAccountInfo({
      address,
      sdk
    })

    const res = await transferWAudio({
      destination: tokenAccountInfo.address,
      amount,
      ethAddress,
      sdk
    })
    return { res, error: null }
  }

  async function transferWAudio({
    ethAddress,
    destination,
    amount,
    sdk
  }: {
    ethAddress: string
    destination: PublicKey
    amount: AudioWei
    sdk: AudiusSdk
  }) {
    console.info(
      `Transferring ${amount.toString()} wei $AUDIO to ${destination.toBase58()}`
    )

    const wAudioAmount = wAUDIO(AUDIO(amount))
    const secpTransactionInstruction =
      await sdk.services.claimableTokensClient.createTransferSecpInstruction({
        amount: wAudioAmount.value,
        ethWallet: ethAddress,
        mint: 'wAUDIO',
        destination
      })
    const transferInstruction =
      await sdk.services.claimableTokensClient.createTransferInstruction({
        ethWallet: ethAddress,
        mint: 'wAUDIO',
        destination
      })
    const transaction = await sdk.services.solanaClient.buildTransaction({
      instructions: [secpTransactionInstruction, transferInstruction]
    })
    const signature =
      await sdk.services.claimableTokensClient.sendTransaction(transaction)
    return signature
  }

  async function getSignature({ data, sdk }: { data: any; sdk: AudiusSdk }) {
    return signData({ data, sdk })
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
    sdk: AudiusSdk
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
    mint: MintName
  }) {
    const solanaTokenProgramKey = new PublicKey(TOKEN_PROGRAM_ID)
    const mintKey = getMintAddress(mint)
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
    sdk
  }: {
    address: string
    sdk: AudiusSdk
  }) {
    const connection = sdk.services.solanaClient.connection
    const pubkey = new PublicKey(address)
    try {
      return await getAccount(connection, pubkey)
    } catch (err) {
      // Account exists but is not a token account. Assume it's a root account
      // and try to derive an associated account from it.
      if (err instanceof TokenInvalidAccountOwnerError) {
        console.info(
          'Provided recipient solana address was not a token account. Assuming root account.'
        )
        const associatedTokenAccount = findAssociatedTokenAddress({
          solanaWalletKey: pubkey,
          mint: 'wAUDIO'
        })
        return await getAccount(connection, associatedTokenAccount)
      }
      // Other error (including non-existent account)
      throw err
    }
  }

  /**
   * Creates an associated token account for a given solana account (a wallet)
   * @param feePayerKey
   * @param solanaWalletKey the wallet we wish to create a token account for
   * @param mintKey
   * @param solanaTokenProgramKey
   * @param connection
   * @param identityService
   */
  async function getCreateAssociatedTokenAccountTransaction({
    feePayerKey,
    solanaWalletKey,
    mint,
    solanaTokenProgramKey,
    connection
  }: {
    feePayerKey: PublicKey
    solanaWalletKey: PublicKey
    mint: MintName
    solanaTokenProgramKey: PublicKey
    connection: Connection
  }) {
    const associatedTokenAddress = findAssociatedTokenAddress({
      solanaWalletKey,
      mint
    })
    const mintKey = getMintAddress(mint)
    const accounts = [
      // 0. `[sw]` Funding account (must be a system account)
      {
        pubkey: feePayerKey,
        isSigner: true,
        isWritable: true
      },
      // 1. `[w]` Associated token account address to be created
      {
        pubkey: associatedTokenAddress,
        isSigner: false,
        isWritable: true
      },
      // 2. `[r]` Wallet address for the new associated token account
      {
        pubkey: solanaWalletKey,
        isSigner: false,
        isWritable: false
      },
      // 3. `[r]` The token mint for the new associated token account
      {
        pubkey: mintKey,
        isSigner: false,
        isWritable: false
      },
      // 4. `[r]` System program
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false
      },
      // 5. `[r]` SPL Token program
      {
        pubkey: solanaTokenProgramKey,
        isSigner: false,
        isWritable: false
      },
      // 6. `[r]` Rent sysvar
      {
        pubkey: SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false
      }
    ]

    const { blockhash } = await connection.getLatestBlockhash('confirmed')
    const instr = new TransactionInstruction({
      keys: accounts.map((account) => ({
        pubkey: account.pubkey,
        isSigner: account.isSigner,
        isWritable: account.isWritable
      })),
      programId: ASSOCIATED_TOKEN_PROGRAM_ID,
      data: Buffer.from([])
    })
    const tx = new Transaction({ recentBlockhash: blockhash })
    tx.feePayer = feePayerKey
    tx.add(instr)
    return tx
  }

  return {
    addDiscoveryProviderSelectionListener,
    clearNotificationBadges,
    currentDiscoveryProvider,
    deregisterDeviceToken,
    didSelectDiscoveryProviderListeners,
    disableBrowserNotifications,
    findAssociatedTokenAddress,
    getAddressTotalStakedBalance,
    getAddressWAudioBalance,
    getAddressSolBalance,
    getAssociatedTokenAccountInfo,
    getBalance,
    getBrowserPushNotificationSettings,
    getBrowserPushSubscription,
    getEmailNotificationSettings,
    getPushNotificationSettings,
    getSafariBrowserPushEnabled,
    getSignature,
    getWAudioBalance,
    identityServiceUrl,
    recordTrackListen,
    registerDeviceToken,
    sendWAudioTokens,
    sendWelcomeEmail,
    signData,
    signGatedContentRequest,
    signDiscoveryNodeRequest,
    signIdentityServiceRequest,
    instagramHandle,
    tiktokHandle,
    updateBrowserNotifications,
    updateCreator,
    updateEmailNotificationSettings,
    updateHCaptchaScore,
    updateNotificationSettings,
    updatePushNotificationSettings,
    updateUserEvent,
    updateUserLocationTimezone
  }
}

export type AudiusBackend = ReturnType<typeof audiusBackend>
