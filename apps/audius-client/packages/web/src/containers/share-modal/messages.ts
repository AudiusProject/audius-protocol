import { ShareType } from 'common/store/ui/share-modal/types'

const shareTypeMap: Record<ShareType, string> = {
  track: 'Track',
  profile: 'Profile'
}

export const messages = {
  modalTitle: (asset: ShareType) => `Share ${shareTypeMap[asset]}`,
  twitter: 'Share to Twitter',
  tikTok: 'Share Sound to TikTok',
  copyLink: (asset: ShareType) => `Copy Link to ${shareTypeMap[asset]}`
}
