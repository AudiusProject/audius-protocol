import {
  CallToActionBanner,
  CallToActionBannerProps
} from './CallToActionBanner'

const messages = {
  text: 'A New Version Is Available',
  pill: 'Close and update'
}

type UpdateAppBannerProps = Pick<
  CallToActionBannerProps,
  'onAccept' | 'onClose'
>

export const UpdateAppBanner = ({
  onAccept,
  onClose
}: UpdateAppBannerProps) => {
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
