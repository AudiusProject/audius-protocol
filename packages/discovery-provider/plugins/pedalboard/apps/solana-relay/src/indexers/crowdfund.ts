import { BN, BorshInstructionCoder } from '@coral-xyz/anchor'
import { initializeDiscoveryDb } from '@pedalboard/basekit'
import { IndexingCheckpoints, CrowdfundUnlocks } from '@pedalboard/storage'
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

const processTx = async (message: VersionedMessage) => {
  const coder = new BorshInstructionCoder(IDL as CrowdfundIDL)

  const lookupTableAccounts = await getLookupTableAccounts(
    message.addressTableLookups.map((k) => k.accountKey)
  )
  const decompiled = TransactionMessage.decompile(message, {
    addressLookupTableAccounts: lookupTableAccounts
  })
  for (const ix of decompiled.instructions) {
    if (ix.programId.toBase58() !== IDL.address) {
      logger.warn('Skipping instruction from', ix.programId.toBase58())
    }
    const instruction = coder.decode(ix.data) as CrowdfundInstruction

    // const instructionFormatted = coder.format(instruction, ix.keys)

    if (instruction?.name === 'unlock') {
      await discoveryDb<CrowdfundUnlocks>('crowdfund_unlocks').insert({
        ...instruction.data._data
      })
      logger.info(
        {
          contentType:
            instruction.data._data.content_type === 1 ? 'track' : 'album',
          contentId: instruction.data._data.content_id
        },
        'Unlocking...'
      )
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
    const batch = await connection.getSignaturesForAddress(programId, {
      before: lastBatchSignature
    })
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
        batches.unshift(batch.slice(0, intersectionIndex - 1).reverse())
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
  logger.debug(`Processing ${batches.length} batches...`)
  for (const batch of batches) {
    await discoveryDb.transaction(async (dbTransaction) => {
      try {
        logger.debug(`Processing ${batch.length} signatures...`)
        for (const sigRes of batch) {
          if (sigRes.err) continue
          const res = await connection.getTransaction(sigRes.signature, {
            maxSupportedTransactionVersion: 0
          })
          if (res && res.transaction) {
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
