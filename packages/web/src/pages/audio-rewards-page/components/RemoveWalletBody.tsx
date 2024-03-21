import { useCallback } from 'react'

import {
  tokenDashboardPageSelectors,
  tokenDashboardPageActions
} from '@audius/common/store'
import { Button, Flex } from '@audius/harmony'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { useSelector } from 'utils/reducer'

import styles from './RemoveWalletBody.module.css'
const { getRemoveWallet } = tokenDashboardPageSelectors
const { confirmRemoveWallet, pressConnectWallets } = tokenDashboardPageActions

const messages = {
  warning: 'Are you sure you want to remove this wallet from your account?',
  remove: 'Remove Wallet',
  ignore: 'Nevermind'
}

type RemoveWalletBodyProps = {
  className?: string
}

const RemoveWalletBody = ({ className }: RemoveWalletBodyProps) => {
  const dispatch = useDispatch()
  const { wallet, chain } = useSelector(getRemoveWallet)
  const onRemove = useCallback(() => {
    if (wallet && chain) dispatch(confirmRemoveWallet({ wallet, chain }))
  }, [dispatch, wallet, chain])
  const onIgnore = useCallback(
    () => dispatch(pressConnectWallets()),
    [dispatch]
  )

  return (
    <div className={cn(styles.container, { [className!]: !!className })}>
      <p className={styles.warning}>{messages.warning}</p>
      <p className={styles.wallet}>{wallet}</p>
      <Flex justifyContent='center' gap='l'>
        <Button variant='destructive' onClick={onRemove}>
          {messages.remove}
        </Button>
        <Button variant='secondary' onClick={onIgnore}>
          {messages.ignore}
        </Button>
      </Flex>
    </div>
  )
}

export default RemoveWalletBody
