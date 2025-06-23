import { AUDIO } from '@audius/fixed-decimal'
import cn from 'classnames'

import IconBronzeBadge from '../../assets/img/IconBronzeBadge.svg'
import IconGoldBadge from '../../assets/img/IconGoldBadge.svg'
import IconPlatinumBadge from '../../assets/img/IconPlatinumBadge.svg'
import IconSilverBadge from '../../assets/img/IconSilverBadge.svg'
import IconArrowGrey from '../../assets/img/iconArrowGrey.svg'
import IconVerified from '../../assets/img/iconVerified.svg'
import { getCopyableLink } from '../../util/shareUtil'
import AudiusLogoButton from '../button/AudiusLogoButton'

import styles from './CollectiblesHeader.module.css'

const badgeTiers = [
  {
    tier: 'platinum',
    icon: <IconPlatinumBadge />,
    amount: AUDIO('10000').value
  },
  {
    tier: 'gold',
    icon: <IconGoldBadge />,
    amount: AUDIO('1000').value
  },
  {
    tier: 'silver',
    icon: <IconSilverBadge />,
    amount: AUDIO('100').value
  },
  {
    tier: 'bronze',
    icon: <IconBronzeBadge />,
    amount: AUDIO('10').value
  }
]

const getTierIcon = (balance) => {
  const balanceWei = AUDIO(balance).value
  const index = badgeTiers.findIndex((t) => t.amount <= balanceWei)
  const tier = index === -1 ? null : badgeTiers[index]
  return tier ? tier.icon : null
}

const CollectiblesHeader = ({
  user,
  backButtonVisible = false,
  onBackButtonClick = () => {}
}) => {
  const { name, handle, isVerified, totalBalance } = user
  const onClick = () =>
    window.open(getCopyableLink(`${handle}/collectibles`), '_blank')

  return (
    <div
      className={cn(styles.header, { [styles.leftPad]: backButtonVisible })}
      onClick={onClick}
    >
      <div className={styles.headerInfo}>
        <div
          className={cn(styles.backButton, {
            [styles.visible]: backButtonVisible
          })}
          onClick={(e) => {
            e.stopPropagation()
            onBackButtonClick()
          }}
        >
          <IconArrowGrey />
        </div>
        <h2>NFT COLLECTIBLES</h2>
        <div className={styles.userInfo}>
          <h2>{name}</h2>
          {isVerified && <IconVerified />}
          {getTierIcon(totalBalance)}
        </div>
      </div>
      <div className={styles.logo}>
        <AudiusLogoButton />
      </div>
    </div>
  )
}

export default CollectiblesHeader
