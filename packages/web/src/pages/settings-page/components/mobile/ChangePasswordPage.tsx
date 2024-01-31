import { useCallback, useContext, useEffect } from 'react'

import { Name } from '@audius/common/models'
import {
  changePasswordSelectors,
  changePasswordActions,
  ChangePasswordPageStep
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { make, TrackEvent } from 'common/store/analytics/actions'
import { ChangePassword } from 'components/change-password/ChangePassword'
import NavContext, {
  CenterPreset,
  LeftPreset
} from 'components/nav/store/context'

import styles from './ChangePasswordPage.module.css'
import { SettingsPageProps } from './SettingsPage'
const { changePage } = changePasswordActions
const { getCurrentPage } = changePasswordSelectors

export const ChangePasswordPage = ({ goBack }: SettingsPageProps) => {
  const dispatch = useDispatch()
  const navContext = useContext(NavContext)!
  navContext.setCenter(CenterPreset.LOGO)

  const currentPage = useSelector(getCurrentPage)

  // Remove back arrow on new password and loading pages
  useEffect(() => {
    if (
      [
        ChangePasswordPageStep.NEW_PASSWORD,
        ChangePasswordPageStep.LOADING
      ].includes(currentPage)
    ) {
      navContext.setLeft(null)
    } else {
      navContext.setLeft(LeftPreset.BACK)
    }
  }, [navContext, currentPage])

  // Go back to account settings when done
  const onComplete = useCallback(() => {
    goBack()
  }, [goBack])

  // On initial render, set the page to confirm credentials
  useEffect(() => {
    dispatch(changePage(ChangePasswordPageStep.CONFIRM_CREDENTIALS))
    const trackEvent: TrackEvent = make(Name.SETTINGS_START_CHANGE_PASSWORD, {})
    dispatch(trackEvent)
  }, [dispatch])

  return (
    <div className={styles.container}>
      <ChangePassword isMobile={true} onComplete={onComplete} />
    </div>
  )
}
