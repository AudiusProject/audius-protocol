import { useState, useEffect } from 'react'
import { Utils } from '@audius/libs'
import { useProtocolDelegator } from 'store/cache/protocol/hooks'
import { useUser } from 'store/cache/user/hooks'
import { Address, BigNumber, Status, Operator } from 'types'

export const useUserDelegation = (wallet: Address) => {
  const [status, setStatus] = useState<undefined | Status>()
  const [error, setError] = useState<string>('')
  const [max, setMax] = useState<BigNumber>(Utils.toBN('0'))

  const { status: userStatus, user } = useUser({ wallet })

  const delegationInfo = useProtocolDelegator()

  const min = delegationInfo.minDelgationAmount

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
      const userMax = (user as Operator).serviceProvider.maxAccountStake
      const userTotalStaked = (user as Operator).totalStakedFor
      const allowedMax = userMax.sub(userTotalStaked)
      setMax(allowedMax)
      setStatus(Status.Success)
    }
  }, [status, userStatus, user, setMax])

  return { error, status, min, max, user }
}
