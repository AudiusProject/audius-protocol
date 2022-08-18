import { useEffect } from 'react'

import { Name } from '@audius/common'
import { Modal } from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'

import { make, TrackEvent } from 'common/store/analytics/actions'
import { getCurrentPage } from 'common/store/change-password/selectors'
import { changePage, Page } from 'common/store/change-password/slice'

import { ChangePassword } from './ChangePassword'

const messages = {
  title: (
    <>
      <i className='emoji lock'></i>&nbsp;Change Password
    </>
  )
}

export const ChangePasswordModal = (props: any) => {
  const { showModal, onClose } = props

  const dispatch = useDispatch()

  const currentPage = useSelector(getCurrentPage)
  const allowClose = [
    Page.CONFIRM_CREDENTIALS,
    Page.FAILURE,
    Page.SUCCESS
  ].includes(currentPage)

  useEffect(() => {
    if (showModal) {
      dispatch(changePage(Page.CONFIRM_CREDENTIALS))
      const trackEvent: TrackEvent = make(
        Name.SETTINGS_START_CHANGE_PASSWORD,
        {}
      )
      dispatch(trackEvent)
    }
  }, [dispatch, showModal])

  return (
    <Modal
      title={messages.title}
      showTitleHeader
      showDismissButton={allowClose}
      dismissOnClickOutside={allowClose}
      isOpen={showModal}
      onClose={onClose}
    >
      <ChangePassword isMobile={false} onComplete={onClose} />
    </Modal>
  )
}
