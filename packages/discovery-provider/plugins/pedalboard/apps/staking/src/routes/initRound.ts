import { NextFunction, Request, Response } from 'express'
import { App } from '@pedalboard/basekit'
import { SharedData } from '..'
import { ClaimsManager } from '@audius/eth'
import { PublicClient } from 'viem'

export const initRound = (app: App<SharedData>) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { viemClient } = app.viewAppData()
  const claimsManager = new ClaimsManager(viemClient as PublicClient)

  const latestBlock = Number((await viemClient.getBlock()).number)
  const lastFundedBlockNumber = Number(await claimsManager.getLastFundedBlock())
  const fundingRoundBlockDiff = Number(await claimsManager.getFundingRoundBlockDiff())
  const blockDiff = latestBlock - lastFundedBlockNumber

  if (lastFundedBlockNumber < latestBlock - 1.1 * fundingRoundBlockDiff) {
    res.status(400).send({
      status: 'Last funded block is too old',
      lastFundedBlockNumber,
      latestBlock,
      fundingRoundBlockDiff,
      blockDiff,
    })
    next()
    return
  }

  res.send({
    status: 'Last funded block is recent enough',
    lastFundedBlockNumber,
    latestBlock,
    fundingRoundBlockDiff,
    blockDiff,
  })
  next()
}

