import { createResponsiveStyles, useMedia, Spacing } from '@audius/harmony'

// Use ReturnType to get the MediaContextType
type MediaContext = ReturnType<typeof useMedia>

export const getCashWalletStyles = (media: MediaContext, spacing: Spacing) => {
  return createResponsiveStyles(media, {
    // Main layout flex container
    mainFlex: {
      tablet: {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.l
      }
    },

    // Payout wallet flex container
    payoutWalletFlex: {
      mobile: (currentMedia) => ({
        ...(currentMedia.isExtraSmall && {
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: spacing.xs
        })
      })
    },

    // Transaction history link
    transactionLink: {
      tablet: (currentMedia) => ({
        alignSelf: currentMedia.isExtraSmall ? 'flex-start' : 'flex-end'
      })
    },

    // Bottom button area
    buttonArea: {
      mobile: (currentMedia) => ({
        ...(currentMedia.isExtraSmall && {
          flexDirection: 'column',
          gap: spacing.m
        })
      })
    }
  })
}
