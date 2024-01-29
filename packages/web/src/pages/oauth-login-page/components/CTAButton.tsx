import { Button, ButtonProps, IconArrow } from '@audius/stems'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from '../OAuthLoginPage.module.css'

export const CTAButton = ({
  isSubmitting,
  isDisabled,
  ...restProps
}: { isSubmitting: boolean } & ButtonProps) => {
  return (
    <Button
      isDisabled={isSubmitting || isDisabled}
      rightIcon={
        isSubmitting ? (
          <LoadingSpinner className={styles.buttonLoadingSpinner} />
        ) : (
          <IconArrow />
        )
      }
      className={styles.ctaButton}
      {...restProps}
    />
  )
}
