import React, { ReactNode } from 'react'

import { TransactionType, TransactionMethod } from '@audius/common/store'
import cn from 'classnames'

import AppIcon from 'assets/img/appIcon.png'
import IconCoinbaseMini from 'assets/img/iconCoinbaseMini.svg'
import IconReceiveMini from 'assets/img/iconReceive.svg'
import IconSendMini from 'assets/img/iconSend.svg'
import IconStripeMini from 'assets/img/iconStripeMini.svg'
import IconTip from 'assets/img/iconTip.svg'
import IconTransaction from 'assets/img/iconTransaction.svg'
import IconTrophy from 'assets/img/iconTrophy.svg'

import styles from './AudioTransactionIcon.module.css'

type AudioTransactionIconProps = {
  type: TransactionType
  method: TransactionMethod
}

type IconProps = {
  type: TransactionType
  method: TransactionMethod
}

const typeIconSvgMap: Record<
  TransactionType,
  React.FunctionComponent<React.SVGProps<SVGSVGElement>> | null
> = {
  [TransactionType.CHALLENGE_REWARD]: IconTrophy,
  [TransactionType.PURCHASE]: null, // Not needed, AppLogo is used for purchases
  [TransactionType.TIP]: IconTip,
  [TransactionType.TRANSFER]: IconTransaction,
  [TransactionType.TRENDING_REWARD]: IconTrophy
} as const

const AppLogo = () => (
  <img src={AppIcon} alt={'Audius Logo'} width={40} height={40} />
)

const TypeIcon = ({ type, method }: IconProps) => {
  const IconSvg = typeIconSvgMap[type]

  return (
    <div className={cn(styles.icon, styles[method.toLowerCase()])}>
      {IconSvg && <IconSvg className={styles.iconSvg} />}
    </div>
  )
}

const typeIconMap: Record<
  TransactionType,
  React.FunctionComponent<IconProps>
> = {
  [TransactionType.CHALLENGE_REWARD]: TypeIcon,
  [TransactionType.PURCHASE]: AppLogo,
  [TransactionType.TIP]: TypeIcon,
  [TransactionType.TRANSFER]: TypeIcon,
  [TransactionType.TRENDING_REWARD]: TypeIcon
} as const

const methodIconMap: Record<TransactionMethod, ReactNode> = {
  [TransactionMethod.COINBASE]: <IconCoinbaseMini />,
  [TransactionMethod.RECEIVE]: <IconReceiveMini />,
  [TransactionMethod.SEND]: <IconSendMini />,
  [TransactionMethod.STRIPE]: <IconStripeMini />
} as const

export const AudioTransactionIcon = ({
  type,
  method
}: AudioTransactionIconProps) => {
  const Icon = typeIconMap[type]
  return (
    <div className={styles.transactionIcon}>
      <div
        className={cn(styles.transactionIconMini, styles[method.toLowerCase()])}
      >
        {methodIconMap[method]}
      </div>
      <Icon type={type} method={method} />
    </div>
  )
}
