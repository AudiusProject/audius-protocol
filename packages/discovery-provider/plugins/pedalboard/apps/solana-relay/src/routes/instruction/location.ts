import { PublicKey, TransactionInstruction } from '@solana/web3.js'
import { NextFunction, Request, Response } from 'express'

import { getRequestIpData } from '../../utils/ipData'

const MEMO_V2_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
const GEO_MEMO_STRING = 'geo'

/**
 * Returns a memo instruction containing geo location data.
 */
export const location = async (
  req: Request<
    unknown,
    unknown,
    unknown,
    {
      signer?: string
    }
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const signer = req.query.signer
    if (!signer) {
      res.status(400).send({ error: 'Missing signer parameter' })
      next()
    }
    const location = await getRequestIpData(res.locals.logger, req)
    const instruction = new TransactionInstruction({
      keys: signer
        ? [
            {
              pubkey: new PublicKey(signer),
              isSigner: true,
              isWritable: true
            }
          ]
        : [],
      data: Buffer.from(
        `${GEO_MEMO_STRING}:${JSON.stringify(location)}`,
        'utf-8'
      ),
      programId: new PublicKey(MEMO_V2_PROGRAM_ID)
    })
    res.status(200).send({ instruction })
    next()
  } catch (e) {
    next(e)
  }
}
