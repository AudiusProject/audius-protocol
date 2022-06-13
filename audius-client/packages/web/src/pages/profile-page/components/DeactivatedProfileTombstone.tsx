import { ButtonSize, IconArrowWhite, Button, ButtonType } from '@audius/stems'
import cn from 'classnames'

import styles from './DeactivatedProfileTombstone.module.css'

const messages = {
  helpText: 'This Account No Longer Exists',
  buttonText: 'Take Me Back To The Music'
}

export const DeactivatedProfileTombstone = ({
  goToRoute,
  isMobile = false
}: {
  goToRoute: (route: string) => void
  isMobile?: boolean
}) => {
  return (
    <div className={cn(styles.deactivated, { [styles.mobile]: isMobile })}>
      <div className={styles.deactivatedText}>{messages.helpText}</div>
      <Button
        className={styles.deactivatedBackButton}
        onClick={() => goToRoute('/')}
        type={ButtonType.PRIMARY_ALT}
        size={ButtonSize.MEDIUM}
        text={messages.buttonText}
        rightIcon={<IconArrowWhite />}
      />
    </div>
  )
}
