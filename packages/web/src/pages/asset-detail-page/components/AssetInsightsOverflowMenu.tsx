import { useCallback, useContext, useState } from 'react'

import { useArtistCoin } from '@audius/common/api'
import { coinDetailsMessages } from '@audius/common/messages'
import { COIN_DETAIL_ROUTE } from '@audius/common/src/utils/route'
import { formatTickerForUrl, route } from '@audius/common/utils'
import {
  PopupMenu,
  PopupMenuItem,
  IconCopy,
  IconExternalLink,
  IconButton,
  IconKebabHorizontal,
  IconInfo
} from '@audius/harmony'
import { useNavigate } from 'react-router-dom-v5-compat'

import ActionDrawer from 'components/action-drawer/ActionDrawer'
import { ToastContext } from 'components/toast/ToastContext'
import { useIsMobile } from 'hooks/useIsMobile'

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
  const navigate = useNavigate()
  const { toast } = useContext(ToastContext)
  const { data: artistCoin } = useArtistCoin(mint)
  const isMobile = useIsMobile()
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isMobileOverflowOpen, setIsMobileOverflowOpen] = useState(false)

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
    if (isMobile) {
      if (artistCoin?.ticker) {
        navigate(
          COIN_DETAIL_ROUTE.replace(
            ':ticker',
            formatTickerForUrl(artistCoin.ticker)
          )
        )
      }
    } else {
      setIsDetailsModalOpen(true)
    }
  }
  const onOpenMobileOverflow = useCallback(() => {
    setIsMobileOverflowOpen(true)
  }, [setIsMobileOverflowOpen])

  const onCloseMobileOverflow = useCallback(() => {
    setIsMobileOverflowOpen(false)
  }, [setIsMobileOverflowOpen])

  const menuItems: PopupMenuItem[] = [
    {
      text: messages.copyCoinAddress,
      icon: <IconCopy color='default' />,
      onClick: onCopyCoinAddress
    },
    {
      text: messages.openDexscreener,
      icon: <IconExternalLink color='default' />,
      onClick: onOpenDexscreener
    },
    {
      text: messages.details,
      icon: <IconInfo color='default' />,
      onClick: onOpenDetails
    }
  ]

  // Don't render if no artist coin data
  if (!artistCoin?.mint) {
    return null
  }

  if (isMobile) {
    return (
      <>
        <IconButton
          icon={IconKebabHorizontal}
          onClick={onOpenMobileOverflow}
          aria-label='More options'
        />
        <ActionDrawer
          actions={menuItems.map((item) => ({
            text: item.text as string,
            icon: item.icon,
            onClick: (e) => {
              // @ts-ignore - Element vs HTMLElement
              item.onClick?.(e)
              onCloseMobileOverflow()
            }
          }))}
          isOpen={isMobileOverflowOpen}
          onClose={onCloseMobileOverflow}
        />
      </>
    )
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
