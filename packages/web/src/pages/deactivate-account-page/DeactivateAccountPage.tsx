import { ReactNode, useCallback, useEffect } from 'react'

import {
  deactivateAccountActions,
  deactivateAccountSelectors,
  Name,
  Status
} from '@audius/common'
import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { make, useRecord } from 'common/store/analytics/actions'
import LoadingSpinnerFullPage from 'components/loading-spinner-full-page/LoadingSpinnerFullPage'
import { useIsMobile } from 'hooks/useIsMobile'

import styles from './DeactivateAccountPage.module.css'
import { DeactivateAccountPageDesktop } from './components/desktop/DeactivateAccountPage'
import { DeactivateAccountPageMobile } from './components/mobile/DeactivateAccountPage'

const { deactivateAccount } = deactivateAccountActions
const { getDeactivateAccountStatus } = deactivateAccountSelectors

export const messages = {
  title: 'Delete',
  description: 'Delete your account',
  header: 'Are You Sure You Want To Delete Your Account?',
  listItems: [
    "There's no going back.",
    'This will remove all of your tracks, albums and playlists.',
    'You will not be able to re-register with the same email or handle'
  ],
  confirmTitle: 'Delete Account',
  confirm: 'Are you sure? This cannot be undone.',
  buttonDeactivate: 'Delete',
  buttonSafety: 'Take me back to safety',
  buttonGoBack: 'Go Back',
  errorMessage: 'Something went wrong.',
  errorMessageTryAgain: 'Please try again.'
}

export type DeactivateAccountPageProps = {
  children: ReactNode
  isConfirmationVisible: boolean
  isLoading: boolean
  openConfirmation: () => void
  onConfirm: () => void
  closeConfirmation: () => void
  onDrawerSelection: (rowNum: number) => void
}

type DeactivateAccountPageContentsProps = {
  isError: boolean
  isLoading: boolean
  isMobile: boolean
  openConfirmation: () => void
}

export const DeactivateAcccountPageContents = ({
  isError,
  isLoading,
  isMobile,
  openConfirmation
}: DeactivateAccountPageContentsProps) => {
  const dispatch = useDispatch()
  const goToSafety = useCallback(() => {
    dispatch(pushRoute('/'))
  }, [dispatch])
  return (
    <div className={cn(styles.tile, { [styles.mobile]: isMobile })}>
      <div className={styles.header}>{messages.header}</div>
      <ul className={styles.list}>
        {messages.listItems.map((message, i) => (
          <li key={i}>{message}</li>
        ))}
      </ul>
      {isLoading && isMobile && <LoadingSpinnerFullPage />}
      {isError && (
        <div className={styles.error}>
          <span className={styles.errorMessage}>{messages.errorMessage}</span>{' '}
          <span className={styles.errorMessage}>
            {messages.errorMessageTryAgain}
          </span>
        </div>
      )}
      <div className={styles.buttons}>
        <Button
          className={cn(styles.button, {
            [styles.buttonDanger]: !(isLoading && isMobile)
          })}
          text={messages.buttonDeactivate}
          type={
            isLoading && isMobile ? ButtonType.DISABLED : ButtonType.PRIMARY_ALT
          }
          onClick={openConfirmation}
        />
        <Button
          className={styles.button}
          text={messages.buttonSafety}
          type={
            isLoading && isMobile ? ButtonType.DISABLED : ButtonType.PRIMARY_ALT
          }
          onClick={goToSafety}
        />
      </div>
    </div>
  )
}

export const DeactivateAccountPage = () => {
  const isMobile = useIsMobile()
  const Page = isMobile
    ? DeactivateAccountPageMobile
    : DeactivateAccountPageDesktop

  const dispatch = useDispatch()

  const deactivateAccountStatus = useSelector(getDeactivateAccountStatus)
  const [isConfirmationVisible, setIsConfirmationVisible] = useModalState(
    'DeactivateAccountConfirmation'
  )
  const isDeactivating = deactivateAccountStatus === Status.LOADING

  const openConfirmation = useCallback(() => {
    setIsConfirmationVisible(true)
  }, [setIsConfirmationVisible])

  const closeConfirmation = useCallback(() => {
    if (!isDeactivating) {
      setIsConfirmationVisible(false)
    }
  }, [isDeactivating, setIsConfirmationVisible])

  const onConfirm = useCallback(() => {
    dispatch(deactivateAccount())
  }, [dispatch])

  const onDrawerSelection = useCallback(
    (rowNumber: number) => {
      if (rowNumber === 0) {
        onConfirm()
        closeConfirmation()
      } else {
        closeConfirmation()
      }
    },
    [onConfirm, closeConfirmation]
  )
  const record = useRecord()
  useEffect(() => {
    record(make(Name.DEACTIVATE_ACCOUNT_PAGE_VIEW, {}))
  }, [record])

  useEffect(() => {
    if (deactivateAccountStatus === Status.ERROR) {
      closeConfirmation()
    }
  }, [deactivateAccountStatus, closeConfirmation])

  return (
    <Page
      openConfirmation={openConfirmation}
      isConfirmationVisible={isConfirmationVisible}
      closeConfirmation={closeConfirmation}
      onDrawerSelection={onDrawerSelection}
      onConfirm={onConfirm}
      isLoading={isDeactivating}
    >
      <DeactivateAcccountPageContents
        isError={deactivateAccountStatus === Status.ERROR}
        isLoading={isDeactivating}
        isMobile={isMobile}
        openConfirmation={openConfirmation}
      />
    </Page>
  )
}
