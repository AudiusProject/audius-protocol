import { NextFunction, Request, Response } from 'express'
import { App } from '@pedalboard/basekit'
import { SharedData } from '..'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { formatEther } from 'viem'

export const balance = (app: App<SharedData>) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('req.params', req.query)
  const { address, chain, minBalance = '0' } = req.query as {
    address: string
    chain: string
    minBalance: string
  }

  if (!address) {
    res.status(400).send({ error: 'address is required' })
    next()
    return
  }
  if (chain !== 'solana' && chain !== 'eth') {
    res.status(400).send({ error: 'chain is required to be solana or eth' })
    next()
    return
  }

  const { viemClient, solanaConnection } = app.viewAppData()

  switch (chain) {
    case 'solana': {
      const balance = await solanaConnection.getBalance(new PublicKey(address))
      if (minBalance && balance < parseInt(minBalance)) {
        res.status(400).send({
          sol: (balance / LAMPORTS_PER_SOL).toString(),
          balance: balance.toString(),
          minBalance,
          status: 'below min balance'
        })
      } else {
        res.send({
          sol: (balance / LAMPORTS_PER_SOL).toString(),
          balance: balance.toString(),
          minBalance,
          status: 'above min balance'
        })
      }
      break
    }
    case 'eth': {
      const balance = await viemClient.getBalance({ address: address as `0x${string}` })
      if (minBalance && balance < BigInt(minBalance)) {
        res.status(400).send({
          eth: formatEther(balance),
          balance: balance.toString(),
          minBalance,
          status: 'below min balance'
        })
      } else {
        res.send({
          eth: formatEther(balance),
          balance: balance.toString(),
          minBalance,
          status: 'above min balance'
        })
      }
      break
    }
  }

  next()
}
