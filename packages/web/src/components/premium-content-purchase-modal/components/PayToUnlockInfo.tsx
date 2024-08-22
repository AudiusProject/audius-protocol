import { useCallback } from 'react'

import { Name } from '@audius/common/models'
import { route } from '@audius/common/utils'
import { Text, TextLink } from '@audius/harmony'

import { LockedStatusPill } from 'components/locked-status-pill'
import { make, track } from 'services/analytics'

import styles from './PayToUnlockInfo.module.css'
const { TERMS_OF_SERVICE } = route

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
        size='l'
        strength='strong'
        className={styles.header}
      >
        <span>{messages.payToUnlock}</span>
        <LockedStatusPill locked />
      </Text>
      <Text className={styles.copy} variant='body'>
        <span>{messages.copyPart1}</span>
        <TextLink
          variant='secondary'
          isExternal
          href={TERMS_OF_SERVICE}
          onClick={handleClickTOSLink}
        >
          {messages.termsOfUse}
        </TextLink>
        <span>{messages.copyPart2}</span>
      </Text>
    </div>
  )
}
