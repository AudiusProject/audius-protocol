import { useCallback } from 'react'

import { Name } from '@audius/common'
import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'

import { disablePushNotifications } from 'pages/settings-page/store/mobileSagas'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { localStorage } from 'services/local-storage'
import { make, useRecord } from 'store/analytics/actions'
import { signOut } from 'utils/signOut'

import styles from './SignOut.module.css'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const messages = {
  nevermind: 'NEVERMIND',
  signOut: 'Sign Out',
  signOutButton: 'SIGN OUT',
  confirmSignOut: 'Are you sure you want to sign out?',
  warning:
    'Double check that you have an account recovery email just in case (resend from your settings).'
}

const SignOutPage = ({ onClickBack }: { onClickBack: () => void }) => {
  const record = useRecord()
  const onSignOut = useCallback(async () => {
    if (NATIVE_MOBILE) {
      await disablePushNotifications(audiusBackendInstance)
      record(make(Name.SETTINGS_LOG_OUT, {}))
      await signOut(audiusBackendInstance, localStorage)
    } else {
      record(
        make(Name.SETTINGS_LOG_OUT, {
          callback: () => signOut(audiusBackendInstance, localStorage)
        })
      )
    }
  }, [record])

  return (
    <div className={styles.signOut}>
      <div>{messages.confirmSignOut}</div>
      <div>{messages.warning}</div>
      <Button
        type={ButtonType.PRIMARY_ALT}
        className={cn(styles.nevermindButton, styles.signOutButtons)}
        textClassName={styles.signOutButtonText}
        text={messages.nevermind}
        onClick={onClickBack}
      />
      <Button
        type={ButtonType.COMMON}
        className={styles.signOutButtons}
        textClassName={styles.signOutButtonText}
        text={messages.signOutButton}
        onClick={onSignOut}
      />
    </div>
  )
}

export default SignOutPage
