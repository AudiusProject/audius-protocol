import { BN, BorshInstructionCoder } from '@coral-xyz/anchor'
import { initializeDiscoveryDb } from '@pedalboard/basekit'
import {
  IndexingCheckpoints,
  CrowdfundUnlocks,
  CrowdfundContributions
} from '@pedalboard/storage'
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedMessage,
  ConfirmedSignatureInfo
} from '@solana/web3.js'

import { logger as parentLogger } from '../logger'
import { getLookupTableAccounts } from '../routes/relay/relay'
import { getConnection } from '../utils/connections'

import { Crowdfund as CrowdfundIDL } from './crowdfund.idl'
import * as IDL from './crowdfund.idl.json'

const logger = parentLogger.child({ indexer: 'crowdfund' })

const discoveryDb = initializeDiscoveryDb()

type StartCampaignInstruction = {
  name: 'start_campaign'
  data: {
    campaign: {
      destination_wallet: PublicKey
      funding_threshold: BN
      content_type: number
      content_id: number
    }
  }
}
type ContributeInstruction = {
  name: 'contribute'
  data: {
    data: {
      amount: number
      content_type: number
      content_id: number
    }
  }
}
type ContributeUserBankInstruction = {
  name: 'contribute_user_bank'
  data: {
    data: {
      amount: string
      content_type: number
      content_id: number
      eth_address: number[]
    }
  }
}
type UnlockInstruction = {
  name: 'unlock'
  data: {
    _data: {
      content_type: number
      content_id: number
    }
  }
}

type CrowdfundInstruction =
  | StartCampaignInstruction
  | ContributeInstruction
  | UnlockInstruction
  | ContributeUserBankInstruction

const processTx = async (message: VersionedMessage) => {
  const coder = new BorshInstructionCoder(IDL as CrowdfundIDL)

  const lookupTableAccounts = await getLookupTableAccounts(
    message.addressTableLookups.map((k) => k.accountKey)
  )
  const decompiled = TransactionMessage.decompile(message, {
    addressLookupTableAccounts: lookupTableAccounts
  })
  for (const ix of decompiled.instructions) {
    logger.info(ix)
    if (ix.programId.toBase58() !== IDL.address) {
      logger.warn('Skipping instruction from', ix.programId)
    }
    const instruction = coder.decode(ix.data) as CrowdfundInstruction

    if (instruction?.name === 'unlock') {
      await discoveryDb<CrowdfundUnlocks>('crowdfund_unlocks').insert(
        instruction.data._data
      )
      logger.info(instruction.data._data, 'Unlocking...')
    } else if (instruction?.name === 'contribute_user_bank') {
      const { content_id, content_type, amount } = instruction.data.data
      const ethereum_address =
        '0x' + Buffer.from(instruction.data.data.eth_address).toString('hex')
      const row = {
        content_id,
        content_type,
        ethereum_address,
        amount: BigInt(amount)
      }
      const insert = discoveryDb<
        Omit<CrowdfundContributions, 'amount'> & { amount: bigint }
      >('crowdfund_contributions').insert(row)
      await discoveryDb.raw(
        `? ON CONFLICT (content_id, content_type, ethereum_address) DO UPDATE SET amount = "crowdfund_contributions"."amount" + ?`,
        [insert, BigInt(amount)]
      )
      logger.info(row, 'Contributing...')
    }
  }
}

const getSignatureBatches = async ({
  programId,
  connection,
  lastRunSignature
}: {
  programId: PublicKey
  connection: Connection
  lastRunSignature: string | null
}) => {
  let lastBatchSignature: string | undefined
  const batches: ConfirmedSignatureInfo[][] = []
  let intersectionFound = false
  while (!intersectionFound) {
    const batch = await connection.getSignaturesForAddress(
      programId,
      {
        before: lastBatchSignature
      },
      'confirmed'
    )
    if (!batch || batch.length === 0) {
      break
    }
    lastBatchSignature = batch[batch.length - 1].signature
    const intersectionIndex =
      lastRunSignature !== null
        ? batch.findIndex((tx) => tx.signature === lastRunSignature)
        : -1
    if (intersectionIndex > -1) {
      intersectionFound = true
      if (intersectionIndex > 0) {
        batches.unshift(batch.slice(0, intersectionIndex).reverse())
      }
    } else {
      batches.unshift(batch.reverse())
    }
  }
  return batches
}

export const run = async () => {
  const connection = getConnection()
  const lastRunSignatures: Pick<IndexingCheckpoints, 'signature'>[] =
    await discoveryDb<IndexingCheckpoints>('indexing_checkpoints as cp')
      .select('cp.signature')
      .where('cp.tablename', '=', 'crowdfund_unlocks')
  const lastRunSignature = lastRunSignatures[0]?.signature
  const batches = await getSignatureBatches({
    programId: new PublicKey(IDL.address),
    connection,
    lastRunSignature
  })
  if (batches.length > 0) {
    logger.info(`Processing ${batches.length} batches...`)
  }
  for (const batch of batches) {
    await discoveryDb.transaction(async (dbTransaction) => {
      try {
        logger.info(`Processing ${batch.length} signatures...`)
        for (const sigRes of batch) {
          if (sigRes.err) continue
          const res = await connection.getTransaction(sigRes.signature, {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed'
          })
          if (res && res.transaction) {
            logger.info(
              { signature: sigRes.signature },
              `Processing signature...`
            )
            await processTx(res.transaction.message)
          }
        }

        if (batch.length > 0) {
          const mostRecent = batch[batch.length - 1]
          await discoveryDb<IndexingCheckpoints>('indexing_checkpoints')
            .insert({
              signature: mostRecent.signature,
              last_checkpoint: mostRecent.slot,
              tablename: 'crowdfund_unlocks'
            })
            .onConflict(['tablename'])
            .merge()
        }

        await dbTransaction.commit()
      } catch (e) {
        console.error(e)
        dbTransaction.rollback()
        throw e
      }
    })
  }
}
