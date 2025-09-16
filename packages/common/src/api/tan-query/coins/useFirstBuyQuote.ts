import { FixedDecimal } from '@audius/fixed-decimal'
import {
  FirstBuyQuoteRequest,
  FirstBuyQuoteResponse as FirstBuyQuoteApiResponse
} from '@audius/sdk'
import { useMutation, UseMutationOptions } from '@tanstack/react-query'

import { TOKEN_LISTING_MAP } from '~/store'

import { useQueryContext } from '../utils'

const LAUNCHPAD_TOKEN_DECIMALS = 9

export type UseFirstBuyQuoteParams =
  | {
      /** The amount of SOL in  to get a quote for */
      solUiInputAmount: string
    }
  | {
      /** The amount of the launchpad token to get a quote for */
      tokenUiOutputAmount: string
    }

type FetchFirstBuyQuoteContext = Pick<
  ReturnType<typeof useQueryContext>,
  'audiusSdk'
>

const getFirstBuyQuoteMutationFn =
  (context: FetchFirstBuyQuoteContext) =>
  async (params: UseFirstBuyQuoteParams) => {
    const { audiusSdk } = context

    const sdk = await audiusSdk()
    const solInputAmount =
      'solUiInputAmount' in params
        ? new FixedDecimal(
            params.solUiInputAmount,
            TOKEN_LISTING_MAP.SOL.decimals
          ).trunc(TOKEN_LISTING_MAP.SOL.decimals)
        : undefined
    const tokenOutputAmount =
      'tokenUiOutputAmount' in params
        ? new FixedDecimal(
            params.tokenUiOutputAmount,
            LAUNCHPAD_TOKEN_DECIMALS
          ).trunc(LAUNCHPAD_TOKEN_DECIMALS)
        : undefined

    const firstBuyQuoteParams: FirstBuyQuoteRequest = solInputAmount
      ? {
          solInputAmount: solInputAmount.value.toString()
        }
      : {
          tokenOutputAmount: tokenOutputAmount!.value.toString()
        }

    const firstBuyQuoteRes =
      await sdk.services.solanaRelay.getFirstBuyQuote(firstBuyQuoteParams)

    const solAmountFD = new FixedDecimal(
      BigInt(firstBuyQuoteRes.solInputAmount),
      TOKEN_LISTING_MAP.SOL.decimals // 9 decimals for SOL
    )
    const solAmountUiString = solAmountFD.toLocaleString('en-US', {
      maximumFractionDigits: 6,
      roundingMode: 'trunc'
    })

    const usdcAmountFD = new FixedDecimal(
      BigInt(firstBuyQuoteRes.usdcInputAmount),
      TOKEN_LISTING_MAP.USDC.decimals // 6 decimals for USDC
    )
    const usdcAmountUiString = usdcAmountFD.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      roundingMode: 'trunc'
    })

    const tokenAmountFD = new FixedDecimal(
      BigInt(firstBuyQuoteRes.tokenOutputAmount),
      LAUNCHPAD_TOKEN_DECIMALS // 9 decimals for the launchpad token
    )
    const tokenAmountUiString = tokenAmountFD.toLocaleString('en-US', {
      maximumFractionDigits: 0,
      roundingMode: 'trunc'
    })

    return {
      // ui formatted values
      usdcAmountUiString,
      tokenAmountUiString,
      solAmountUiString,
      // raw values
      solInputAmount: firstBuyQuoteRes.solInputAmount,
      usdcInputAmount: firstBuyQuoteRes.usdcInputAmount,
      tokenOutputAmount: firstBuyQuoteRes.tokenOutputAmount
    } as FirstBuyQuoteHookResponse
  }

type FirstBuyQuoteHookResponse = {
  // Same response as API but adds UI friendly values
  usdcAmountUiString: string
  tokenAmountUiString: string
  solAmountUiString: string
} & FirstBuyQuoteApiResponse

export const useFirstBuyQuote = (
  options?: UseMutationOptions<
    FirstBuyQuoteHookResponse,
    Error,
    UseFirstBuyQuoteParams
  >
) => {
  const context = useQueryContext()

  return useMutation({
    mutationFn: getFirstBuyQuoteMutationFn(context),
    ...options
  })
}
