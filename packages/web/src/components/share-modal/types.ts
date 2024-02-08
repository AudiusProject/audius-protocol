import { ShareType } from '@audius/common/store'

export type ShareProps = {
  onShareToDirectMessage: () => void
  onShareToTwitter: () => void
  onShareToTikTok: () => void
  onCopyLink: () => void
  onEmbed?: () => void
  isOpen: boolean
  onClose: () => void
  onClosed: () => void
  showTikTokShareAction?: boolean
  shareType: ShareType
  isPrivate: boolean
}
