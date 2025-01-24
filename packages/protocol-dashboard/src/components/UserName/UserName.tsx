import React, { useEffect } from 'react'

import clsx from 'clsx'

import UserBadges from 'components/UserInfo/AudiusProfileBadges'
import { useDashboardWalletUser } from 'hooks/useDashboardWalletUsers'
import { useUserProfile } from 'store/cache/user/hooks'
import { Address } from 'types'
import { formatShortWallet } from 'utils/format'

import styles from './UserName.module.css'

type UserNameProps = {
  className?: string
  wallet: Address
  hasLoaded?: () => void
}

const UserName = ({ className, wallet, hasLoaded }: UserNameProps) => {
  const { name } = useUserProfile({ wallet })
  const { data: audiusProfileData } = useDashboardWalletUser(wallet)
  useEffect(() => {
    if (name && hasLoaded) hasLoaded()
  }, [name, hasLoaded])
  const nonWalletName = !!name && name !== wallet
  return (
    <div className={clsx(styles.wrapper, className)}>
      <div
        className={clsx(styles.skeleton, className, {
          [styles.show]: !name
        })}
      />
      {!!name && (nonWalletName ? name : formatShortWallet(wallet))}
      {audiusProfileData == null ? null : (
        <UserBadges
          inline
          audiusProfile={audiusProfileData?.user}
          badgeSize={14}
        />
      )}
    </div>
  )
}

export default UserName
