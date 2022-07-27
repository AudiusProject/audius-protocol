import { useCallback, useContext, useEffect } from 'react'

import { Name } from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import { getCurrentPage } from 'common/store/change-password/selectors'
import { changePage, Page } from 'common/store/change-password/slice'
import { ChangePassword } from 'components/change-password/ChangePassword'
import NavContext, {
  CenterPreset,
  LeftPreset
} from 'components/nav/store/context'
import { make, TrackEvent } from 'store/analytics/actions'

import styles from './ChangePasswordPage.module.css'
import { SettingsPageProps } from './SettingsPage'

export const ChangePasswordPage = ({ goBack }: SettingsPageProps) => {
  const dispatch = useDispatch()
  const navContext = useContext(NavContext)!
  navContext.setCenter(CenterPreset.LOGO)

  const currentPage = useSelector(getCurrentPage)

  // Remove back arrow on new password and loading pages
  useEffect(() => {
    if ([Page.NEW_PASSWORD, Page.LOADING].includes(currentPage)) {
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
    dispatch(changePage(Page.CONFIRM_CREDENTIALS))
    const trackEvent: TrackEvent = make(Name.SETTINGS_START_CHANGE_PASSWORD, {})
    dispatch(trackEvent)
  }, [dispatch])

  return (
    <div className={styles.container}>
      <ChangePassword isMobile={true} onComplete={onComplete} />
    </div>
  )
}
