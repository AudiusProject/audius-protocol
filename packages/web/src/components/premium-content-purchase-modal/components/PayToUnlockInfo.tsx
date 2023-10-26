import cn from 'classnames'
import { Link } from 'react-router-dom'

import { LockedStatusBadge } from 'components/track/LockedStatusBadge'
import { Text } from 'components/typography'
import typeStyles from 'components/typography/typography.module.css'
import { TERMS_OF_SERVICE } from 'utils/route'

import styles from './PayToUnlockInfo.module.css'

const messages = {
  payToUnlock: 'Pay to unlock',
  copyPart1: 'By clicking on "Buy", you agree to our ',
  termsOfUse: 'Terms of Use',
  copyPart2:
    '. Your purchase will be made in USDC via 3rd party payment provider. Additional payment provider fees may apply. Any remaining USDC balance in your Audius wallet will be applied to this transaction. Once your payment is confirmed, your premium content will be unlocked and available to stream.'
}

export const PayToUnlockInfo = ({ disabled }: { disabled: boolean }) => {
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
          className={cn(typeStyles.link, { [styles.disabled]: disabled })}
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
