import { useEffect, useState } from 'react'

import BN from 'bn.js'

import { Status } from 'models/Status'
import { BNUSDC } from 'models/Wallet'
import { getUserbankAccountInfo } from 'services/index'
import { useAppContext } from 'src/context/appContext'

/**
 * On mount, fetches the USDC balance for the current user
 */
export const useUSDCBalance = () => {
  const { audiusBackend } = useAppContext()
  const [status, setStatus] = useState(Status.IDLE)
  const [data, setData] = useState<BNUSDC>()

  useEffect(() => {
    const fetch = async () => {
      setStatus(Status.LOADING)
      try {
        const account = await getUserbankAccountInfo(audiusBackend, {
          mint: 'usdc'
        })
        const balance = (account?.amount ?? new BN(0)) as BNUSDC
        setData(balance)
        setStatus(Status.SUCCESS)
      } catch (e) {
        setStatus(Status.ERROR)
      }
    }
    fetch()
  }, [audiusBackend])

  return { status, data }
}
