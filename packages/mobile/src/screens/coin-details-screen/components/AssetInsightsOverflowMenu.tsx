import { useCallback } from 'react'

import { useArtistCoin } from '@audius/common/api'
import { coinDetailsMessages } from '@audius/common/messages'
import { route } from '@audius/common/utils'
import Clipboard from '@react-native-clipboard/clipboard'
import { Linking } from 'react-native'

import { IconCopy, IconExternalLink } from '@audius/harmony-native'
import ActionDrawer, {
  type ActionDrawerRow
} from 'app/components/action-drawer/ActionDrawer'
import { useDrawer } from 'app/hooks/useDrawer'
import { useToast } from 'app/hooks/useToast'

const messages = coinDetailsMessages.overflowMenu

export const AssetInsightsOverflowMenu = () => {
  const { data: drawerData } = useDrawer('AssetInsightsOverflowMenu')
  const mint = drawerData?.mint
  const { data: artistCoin } = useArtistCoin({ mint })
  const { toast } = useToast()

  const handleCopyCoinAddress = useCallback(() => {
    if (artistCoin?.mint) {
      Clipboard.setString(artistCoin.mint)
      toast({ content: messages.copiedToClipboard, type: 'info' })
    }
  }, [artistCoin?.mint, toast])

  const handleOpenDexscreener = useCallback(() => {
    if (artistCoin?.mint) {
      Linking.openURL(route.dexscreenerUrl(artistCoin.mint))
    }
  }, [artistCoin?.mint])

  const rows: ActionDrawerRow[] = [
    {
      text: messages.copyCoinAddress,
      icon: <IconCopy color='accent' />,
      callback: handleCopyCoinAddress
    },
    {
      text: messages.openDexscreener,
      icon: <IconExternalLink color='accent' />,
      callback: handleOpenDexscreener
    }
  ]

  // Don't render if no artist coin data
  if (!artistCoin?.mint) {
    return null
  }

  return <ActionDrawer drawerName='AssetInsightsOverflowMenu' rows={rows} />
}
