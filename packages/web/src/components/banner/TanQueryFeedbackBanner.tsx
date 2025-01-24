import { useState } from 'react'

import { CallToActionBanner } from './CallToActionBanner'

const messages = {
  text: 'Leave us some feedback',
  pill: ''
}

export const TanQueryFeedbackBanner = () => {
  const [isOpen, setIsOpen] = useState(true)
  const onClose = () => setIsOpen(false)
  const onAccept = () => {
    window.open(
      'https://www.notion.so/audiusproject/Feedback-185c00e6b203800eae87d569bb91d83c?pvs=4',
      '_blank'
    )
  }
  if (!isOpen) return null
  return (
    <CallToActionBanner
      text={messages.text}
      pill={messages.pill}
      pillPosition={'right'}
      emoji='sparkles'
      onClose={onClose}
      onAccept={onAccept}
    />
  )
}
