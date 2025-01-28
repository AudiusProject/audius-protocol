import { CallToActionBanner } from './CallToActionBanner'

const messages = {
  text: 'Leave us some feedback',
  pill: ''
}

export const TanQueryFeedbackBanner = () => {
  const isRealUrl = window.location.href.includes('audius.co')
  const onAccept = () => {
    window.open(
      'https://www.notion.so/audiusproject/Feedback-185c00e6b203800eae87d569bb91d83c?pvs=4',
      '_blank'
    )
  }
  if (!isRealUrl) return null
  return (
    <CallToActionBanner
      text={messages.text}
      pill={messages.pill}
      pillPosition={'right'}
      emoji='sparkles'
      onAccept={onAccept}
    />
  )
}
