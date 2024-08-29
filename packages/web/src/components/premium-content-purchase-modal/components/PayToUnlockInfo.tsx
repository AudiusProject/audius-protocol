import { useCallback } from 'react'

import { Name } from '@audius/common/models'
import { route } from '@audius/common/utils'
import { Text, TextLink } from '@audius/harmony'

import { make, track } from 'services/analytics'

import styles from './PayToUnlockInfo.module.css'
const { TERMS_OF_SERVICE } = route

const messages = {
  copyPart1: 'By proceeding, you agree to our ',
  termsOfUse: 'Terms of Use',
  copyPart2: '. Additional payment provider fees may apply.'
}

export const PayToUnlockInfo = () => {
  const handleClickTOSLink = useCallback(() => {
    track(make({ eventName: Name.PURCHASE_CONTENT_TOS_CLICKED }))
  }, [])

  return (
    <div className={styles.container}>
      <Text className={styles.copy} variant='body' size='xs'>
        <span>{messages.copyPart1}</span>
        <TextLink
          variant='visible'
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
