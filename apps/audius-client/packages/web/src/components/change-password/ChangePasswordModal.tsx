import React, { useEffect } from 'react'

import { Modal } from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'

import { Name } from 'common/models/Analytics'
import { make, TrackEvent } from 'store/analytics/actions'

import { ChangePassword } from './ChangePassword'
import { getCurrentPage } from './store/selectors'
import { changePage, Page } from './store/slice'

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
