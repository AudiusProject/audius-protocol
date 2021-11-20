import React, { cloneElement } from 'react'

import BN from 'bn.js'
import cn from 'classnames'

import { ReactComponent as IconCaretRight } from 'assets/img/iconCaretRight.svg'
import IconNoTierBadge from 'assets/img/tokenBadgeNoTier.png'
import { getAccountUser } from 'common/store/account/selectors'
import { useFlag } from 'containers/remote-config/hooks'
import { audioTierMapPng } from 'containers/user-badges/UserBadges'
import { useSelectTierInfo } from 'containers/user-badges/hooks'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { FeatureFlags } from 'services/remote-config/FeatureFlags'
import { useSelector } from 'utils/reducer'
import { AUDIO_PAGE } from 'utils/route'
import { formatWei, stringWeiToBN } from 'utils/wallet'

import styles from './NavAudio.module.css'

const messages = {
  earnAudio: 'EARN $AUDIO'
}

const NavAudio = () => {
  // TODO: remove this feature flag ASAP as rewards launches because we could show $AUDIO far earlier
  // but need to wait for remote config
  const { isEnabled } = useFlag(FeatureFlags.SURFACE_AUDIO_ENABLED)

  const navigate = useNavigateToPage()
  const account = useSelector(getAccountUser)
  const totalBalance =
    account && account.balance ? stringWeiToBN(account.balance) : null
  const nonNullTotalBalance = totalBalance !== null
  const positiveTotalBalance =
    nonNullTotalBalance && totalBalance!.gt(new BN(0))
  // we only show the audio balance and respective badge when there is an account
  // so below null-coalescing is okay
  const { tier } = useSelectTierInfo(account?.user_id ?? 0)
  const audioBadge = audioTierMapPng[tier]

  if (!isEnabled || !account) {
    return null
  }

  return positiveTotalBalance ? (
    <div
      onClick={() => navigate(AUDIO_PAGE)}
      className={cn(styles.audio, styles.hasBalance, { [styles.show]: true })}
    >
      {audioBadge &&
        cloneElement(audioBadge, {
          height: 16,
          width: 16
        })}
      <span className={styles.audioAmount}>
        {formatWei(totalBalance!, true, 0)}
      </span>
    </div>
  ) : nonNullTotalBalance ? (
    <div
      className={cn(styles.audio, { [styles.show]: true })}
      onClick={() => navigate(AUDIO_PAGE)}
    >
      <img alt='no tier' src={IconNoTierBadge} width='16' height='16' />
      <span className={styles.audioAmount}>
        {formatWei(totalBalance!, true, 0)}
      </span>
      <span className={styles.earnAudio}>
        <span>{messages.earnAudio}</span>
        <IconCaretRight className={styles.earnAudioCaret} />
      </span>
    </div>
  ) : (
    <div className={styles.audio} />
  )
}

export default NavAudio
