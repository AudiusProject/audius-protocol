import { useContext, useEffect } from 'react'

import ActionDrawer from 'components/action-drawer/ActionDrawer'
import { useMobileHeader } from 'components/header/mobile/hooks'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, {
  LeftPreset,
  RightPreset
} from 'components/nav/store/context'
import { BASE_URL, DEACTIVATE_PAGE } from 'utils/route'

import {
  messages,
  DeactivateAccountPageProps
} from '../../DeactivateAccountPage'

import styles from './DeactivateAccountPage.module.css'

const IS_NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const useMobileNavContext = () => {
  useMobileHeader({ title: messages.title })
  const { setLeft, setRight } = useContext(NavContext)!
  useEffect(() => {
    setLeft(LeftPreset.CLOSE)
    setRight(RightPreset.SEARCH)
  }, [setLeft, setRight])
}

const DrawerTitle = () => (
  <div className={styles.drawerTitle}>
    <div className={styles.drawerTitleHeader}>{messages.confirmTitle}</div>
    <div className={styles.drawerTitleWarning}>{messages.confirm}</div>
  </div>
)

export const DeactivateAccountPageMobile = ({
  children,
  isConfirmationVisible,
  onDrawerSelection,
  closeConfirmation
}: DeactivateAccountPageProps) => {
  useMobileNavContext()
  return (
    <MobilePageContainer
      title={messages.title}
      description={messages.description}
      canonicalUrl={`${BASE_URL}${DEACTIVATE_PAGE}`}
      hasDefaultHeader
    >
      {children}
      {!IS_NATIVE_MOBILE && (
        <ActionDrawer
          isOpen={isConfirmationVisible}
          onClose={closeConfirmation}
          actions={[
            { text: messages.buttonDeactivate, isDestructive: true },
            { text: messages.buttonGoBack }
          ]}
          didSelectRow={onDrawerSelection}
          renderTitle={DrawerTitle}
        />
      )}
    </MobilePageContainer>
  )
}
