import { useCallback } from 'react'

import { PurchaseMethod } from '@audius/common/models'
import { purchaseContentActions } from '@audius/common/store'
import { Button } from '@audius/harmony'
import { useDispatch } from 'react-redux'

const { payWithAnything } = purchaseContentActions

const messages = {
  payWithAnything: 'Pay with Anything'
}

export const PayWithAnything = () => {
  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    dispatch(
      payWithAnything({
        inputMint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
        purchaseMethod: PurchaseMethod.WALLET,
        contentId: 1546501759 // this one -> /rayddex/canoufly. to do: get this from the track
      })
    )
  }, [dispatch])

  return <Button onClick={handleClick}>{messages.payWithAnything}</Button>
}
