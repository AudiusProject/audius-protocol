import { ShareType } from '@audius/common/store'

export type ShareProps = {
  onShareToDirectMessage: () => void
  onShareToTwitter: () => void
  onCopyLink: () => void
  onEmbed?: () => void
  isOpen: boolean
  onClose: () => void
  onClosed: () => void
  shareType: ShareType
  isPrivate: boolean
}
