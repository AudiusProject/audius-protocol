import { useCallback } from 'react'

import { Name } from '@audius/common'
import { Link } from 'react-router-dom'

import { LockedStatusBadge } from 'components/track/LockedStatusBadge'
import { Text } from 'components/typography'
import typeStyles from 'components/typography/typography.module.css'
import { make, track } from 'services/analytics'
import { TERMS_OF_SERVICE } from 'utils/route'

import styles from './PayToUnlockInfo.module.css'

const messages = {
  payToUnlock: 'Pay to unlock',
  copyPart1: 'By clicking on "Buy", you agree to our ',
  termsOfUse: 'Terms of Use',
  copyPart2: '. Additional payment provider fees may apply.'
}

export const PayToUnlockInfo = () => {
  const handleClickTOSLink = useCallback(() => {
    track(make({ eventName: Name.PURCHASE_CONTENT_TOS_CLICKED }))
  }, [])
  return (
    <div className={styles.container}>
      <Text
        variant='label'
        size='large'
        strength='strong'
        className={styles.header}
      >
        <span>{messages.payToUnlock}</span>
        <LockedStatusBadge locked />
      </Text>
      <Text className={styles.copy}>
        <span>{messages.copyPart1}</span>
        <Link
          onClick={handleClickTOSLink}
          className={typeStyles.link}
          to={TERMS_OF_SERVICE}
          target='_blank'
          rel='noreferrer'
        >
          {messages.termsOfUse}
        </Link>
        <span>{messages.copyPart2}</span>
      </Text>
    </div>
  )
}
