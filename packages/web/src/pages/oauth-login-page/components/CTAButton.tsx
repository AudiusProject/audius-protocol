import { Button, ButtonProps, IconArrowRight } from '@audius/harmony'

import styles from '../OAuthLoginPage.module.css'

export const CTAButton = (props: ButtonProps) => {
  return (
    <Button
      variant='primary'
      fullWidth
      iconRight={IconArrowRight}
      className={styles.ctaButton}
      {...props}
    />
  )
}
