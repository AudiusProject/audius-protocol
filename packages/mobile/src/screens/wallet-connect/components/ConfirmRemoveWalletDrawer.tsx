import { useCallback } from 'react'

import {
  tokenDashboardPageSelectors,
  tokenDashboardPageActions
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { ConfirmationDrawer } from 'app/components/drawers'
import { useDrawer } from 'app/hooks/useDrawer'

const { cancelRemoveWallet, confirmRemoveWallet } = tokenDashboardPageActions
const { getRemoveWallet } = tokenDashboardPageSelectors

const drawerName = 'ConfirmRemoveWallet'
const messages = {
  header: 'Remove Wallet',
  description: 'Are you sure you want to remove this linked wallet?',
  confirm: 'Remove Linked Wallet',
  cancel: 'Nevermind'
}

export const ConfirmRemoveWalletDrawer = () => {
  const dispatch = useDispatch()

  const { wallet, chain } = useSelector(getRemoveWallet)
  const { onClose } = useDrawer(drawerName)

  const handleConfirm = useCallback(() => {
    if (wallet && chain) {
      dispatch(confirmRemoveWallet({ wallet, chain }))
      onClose()
    }
  }, [onClose, dispatch, wallet, chain])

  const handleCancel = useCallback(() => {
    dispatch(cancelRemoveWallet())
    onClose()
  }, [dispatch, onClose])

  const { visibleState } = useDrawer(drawerName)

  if (visibleState === false) return null

  return (
    <ConfirmationDrawer
      drawerName={drawerName}
      messages={messages}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  )
}
