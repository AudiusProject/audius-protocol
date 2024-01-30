import { useCallback } from 'react'

import { signOutActions } from '@audius/common'
import { Name } from '@audius/common/models'
import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { make, useRecord } from 'common/store/analytics/actions'

import styles from './SignOut.module.css'
const { signOut } = signOutActions

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
  const dispatch = useDispatch()
  const onSignOut = useCallback(async () => {
    record(
      make(Name.SETTINGS_LOG_OUT, {
        callback: () => dispatch(signOut())
      })
    )
  }, [record, dispatch])

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
