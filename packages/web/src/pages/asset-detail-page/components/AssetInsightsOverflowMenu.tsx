import { useContext, useState } from 'react'

import { useArtistCoin } from '@audius/common/api'
import { coinDetailsMessages } from '@audius/common/messages'
import { route } from '@audius/common/utils'
import {
  PopupMenu,
  PopupMenuItem,
  IconCopy,
  IconExternalLink,
  IconButton,
  IconKebabHorizontal,
  IconInfo
} from '@audius/harmony'

import { ToastContext } from 'components/toast/ToastContext'

import { copyToClipboard } from '../../../utils/clipboardUtil'

import { ArtistCoinDetailsModal } from './ArtistCoinDetailsModal'

const messages = coinDetailsMessages.overflowMenu

type AssetInsightsOverflowMenuProps = {
  /**
   * The mint address of the artist coin
   */
  mint: string
}

export const AssetInsightsOverflowMenu = ({
  mint
}: AssetInsightsOverflowMenuProps) => {
  const { toast } = useContext(ToastContext)
  const { data: artistCoin } = useArtistCoin(mint)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const onCopyCoinAddress = () => {
    if (artistCoin?.mint) {
      copyToClipboard(artistCoin.mint)
      toast(messages.copiedToClipboard)
    }
  }

  const onOpenDexscreener = () => {
    if (artistCoin?.mint) {
      window.open(
        route.dexscreenerUrl(artistCoin.mint),
        '_blank',
        'noopener,noreferrer'
      )
    }
  }

  const onOpenDetails = () => {
    setIsDetailsModalOpen(true)
  }

  const menuItems: PopupMenuItem[] = [
    {
      text: messages.copyCoinAddress,
      icon: <IconCopy />,
      onClick: onCopyCoinAddress
    },
    {
      text: messages.openDexscreener,
      icon: <IconExternalLink />,
      onClick: onOpenDexscreener
    },
    {
      text: messages.details,
      icon: <IconInfo />,
      onClick: onOpenDetails
    }
  ]

  // Don't render if no artist coin data
  if (!artistCoin?.mint) {
    return null
  }

  return (
    <>
      <PopupMenu
        items={menuItems}
        renderTrigger={(anchorRef, triggerPopup, triggerProps) => (
          <IconButton
            ref={anchorRef}
            icon={IconKebabHorizontal}
            onClick={() => triggerPopup()}
            aria-label='More options'
            size='l'
            ripple
          />
        )}
      />

      <ArtistCoinDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        mint={mint}
      />
    </>
  )
}
