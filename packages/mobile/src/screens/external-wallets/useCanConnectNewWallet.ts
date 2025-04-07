import { tokenDashboardPageSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

const { getConfirmingWalletStatus, getRemoveWallet } =
  tokenDashboardPageSelectors

export const useCanConnectNewWallet = () => {
  const newWalletStatus = useSelector(getConfirmingWalletStatus)
  const { status: removeWalletStatus } = useSelector(getRemoveWallet)

  const canConnectNewWallet =
    (newWalletStatus === null || newWalletStatus === 'Confirmed') &&
    removeWalletStatus !== 'Confirming'

  return canConnectNewWallet
}
