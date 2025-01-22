import { useState, useEffect } from 'react'

import BN from 'bn.js'

import { useUser } from 'store/cache/user/hooks'
import { Address, BigNumber, Status, Operator } from 'types'

export const useUserDelegation = (wallet: Address) => {
  const [status, setStatus] = useState<undefined | Status>()
  const [error, setError] = useState<string>('')
  const [min, setMin] = useState<BigNumber>(new BN('0'))
  const [max, setMax] = useState<BigNumber>(new BN('0'))

  const { status: userStatus, user } = useUser({ wallet })

  useEffect(() => {
    setStatus(undefined)
    setError('')
  }, [wallet, setStatus, setError])

  useEffect(() => {
    if (userStatus === Status.Success && user && !('serviceProvider' in user)) {
      setStatus(Status.Failure)
      setError('User is not a service provider')
    } else if (
      userStatus === Status.Success &&
      user &&
      'serviceProvider' in user
    ) {
      const minDelegationAmount = (user as Operator).minDelegationAmount
      setMin(minDelegationAmount)
      const userMax = (user as Operator).serviceProvider.maxAccountStake
      const userTotalStaked = (user as Operator).totalStakedFor
      const allowedMax = userMax.sub(userTotalStaked)
      setMax(allowedMax)
      setStatus(Status.Success)
    } else {
      setStatus(Status.Loading)
    }
  }, [status, userStatus, user, setMax])

  return { error, status, min, max, user }
}
