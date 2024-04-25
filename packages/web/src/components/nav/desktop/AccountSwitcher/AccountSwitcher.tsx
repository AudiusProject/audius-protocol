import {
  useGetManagedAccounts,
  useGetUserIdFromWallet
} from '@audius/common/api'
import { useAudiusQueryContext } from '@audius/common/audius-query'
import { IconButton, IconCaretDown } from '@audius/harmony'
import { useEffect, useState } from 'react'

const useEthWalletAddress = () => {
  const { audiusBackend } = useAudiusQueryContext()
  const [ethWalletAddress, setEthWalletAddress] = useState<string | null>(null)

  useEffect(() => {
    const fetchEthWalletAddress = async () => {
      const libs = await audiusBackend.getAudiusLibsTyped()
      const ethWalletAddress = await libs.web3Manager?.getWalletAddress()
      if (!ethWalletAddress) {
        console.error('Unexpected missing ethWalletAddress')
      }
      console.log(ethWalletAddress)
      setEthWalletAddress(ethWalletAddress)
    }

    fetchEthWalletAddress()
  }, [audiusBackend])

  return ethWalletAddress
}

const useManagedAccounts = () => {
  const ethWalletAddress = useEthWalletAddress()
}

export const AccountSwitcher = () => {
  const { data: managedAccounts } = useGetManagedAccounts({})
  const onClickExpander = () => {}

  return managedAccounts && managedAccounts.length ? (
    <IconButton
      color='default'
      size='s'
      aria-label='Open Account Switcher'
      icon={IconCaretDown}
      onClick={onClickExpander}
    />
  ) : null
}
