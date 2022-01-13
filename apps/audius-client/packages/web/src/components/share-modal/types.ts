import { ShareType } from 'common/store/ui/share-modal/types'

export type ShareProps = {
  onShareToTwitter: () => void
  onShareToTikTok: () => void
  onCopyLink: () => void
  isOpen: boolean
  onClose: () => void
  showTikTokShareAction?: boolean
  shareType: ShareType
}
