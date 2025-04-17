import { makeResponsiveStyles } from '@audius/harmony/src/utils'
import { CSSObject } from '@emotion/react'

type Styles = {
  mainFlex: CSSObject
  payoutWalletFlex: CSSObject
  transactionLink: CSSObject
  buttonArea: CSSObject
}

export const useCashWalletStyles = makeResponsiveStyles<Styles>(
  ({ media, theme }) => ({
    // Main layout flex container
    mainFlex: {
      tablet: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.l
      }
    },

    // Payout wallet flex container
    payoutWalletFlex: {
      mobile: {
        ...(media.isExtraSmall && {
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: theme.spacing.xs
        })
      }
    },

    // Transaction history link
    transactionLink: {
      tablet: {
        alignSelf: media.isExtraSmall ? 'flex-start' : 'flex-end'
      }
    },

    // Bottom button area
    buttonArea: {
      mobile: {
        ...(media.isExtraSmall && {
          flexDirection: 'column',
          gap: theme.spacing.m
        })
      }
    }
  })
)
