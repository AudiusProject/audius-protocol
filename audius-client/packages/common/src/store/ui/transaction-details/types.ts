import { StringAudio, Status } from '../../../models'

export enum TransactionType {
  PURCHASE = 'PURCHASE',
  TIP = 'TIP',
  CHALLENGE_REWARD = 'CHALLENGE_REWARD',
  TRENDING_REWARD = 'TRENDING_REWARD',
  TRANSFER = 'TRANSFER'
}

export enum TransactionMethod {
  SEND = 'SENT',
  RECEIVE = 'RECEIVED',
  COINBASE = 'COINBASE',
  STRIPE = 'STRIPE'
}

export enum TransactionMetadataType {
  PURCHASE_SOL_AUDIO_SWAP = 'PURCHASE_SOL_AUDIO_SWAP'
}

export type InAppAudioPurchaseMetadata = {
  discriminator: TransactionMetadataType.PURCHASE_SOL_AUDIO_SWAP
  usd: string
  sol: string
  audio: StringAudio
  swapTransaction: string
  buyTransaction: string
}

export type TransactionDetails = {
  signature: string
  transactionType: TransactionType
  method: TransactionMethod
  date: string
  change: StringAudio
  balance: StringAudio
  metadata: InAppAudioPurchaseMetadata | undefined
}

export type TransactionDetailsState =
  | { status: Status.IDLE }
  | { status: Status.LOADING; transactionId: string }
  | {
      status: Status.SUCCESS
      transactionDetails: TransactionDetails
    }
  | { status: Status.ERROR }
