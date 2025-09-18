import { useContext, useEffect, useState } from 'react'

import { useArtistCoins, useCurrentUserId } from '@audius/common/api'
import { priceAndAudienceMessages } from '@audius/common/messages'
import {
  isContentTokenGated,
  StreamTrackAvailabilityType
} from '@audius/common/models'
import type { AccessConditions } from '@audius/common/models'
import type { Nullable } from '@audius/common/utils'
import { useField } from 'formik'

import { RadioGroupContext, useTheme } from '@audius/harmony-native'
import { TokenIcon } from 'app/components/core'
import { useSetEntityAvailabilityFields } from 'app/hooks/useSetTrackAvailabilityFields'

import { ExpandableRadio } from '../ExpandableRadio'

const { tokenGatedRadio: messages } = priceAndAudienceMessages

type TokenGatedRadioFieldProps = {
  disabled?: boolean
  previousStreamConditions: Nullable<AccessConditions>
}

export const TokenGatedRadioField = (props: TokenGatedRadioFieldProps) => {
  const { disabled, previousStreamConditions } = props
  const { value } = useContext(RadioGroupContext)
  const selected = value === StreamTrackAvailabilityType.TOKEN_GATED
  const { spacing } = useTheme()

  const { data: userId } = useCurrentUserId()
  const { data: coins } = useArtistCoins(
    {
      owner_id: userId ? [userId] : undefined
    },
    {
      enabled: !!userId
    }
  )

  const setFields = useSetEntityAvailabilityFields()
  const [{ value: streamConditions }] =
    useField<Nullable<AccessConditions>>('stream_conditions')
  const [selectedToken, setSelectedToken] = useState(
    isContentTokenGated(previousStreamConditions)
      ? previousStreamConditions.token_gate
      : undefined
  )

  useEffect(() => {
    if (isContentTokenGated(streamConditions)) {
      setSelectedToken(streamConditions.token_gate)
    }
  }, [streamConditions])

  useEffect(() => {
    if (selected) {
      const tokenGate =
        selectedToken ||
        (coins?.length
          ? {
              token_mint: coins[0].mint,
              token_amount: 1
            }
          : undefined)

      if (tokenGate) {
        setFields({
          is_stream_gated: true,
          stream_conditions: { token_gate: tokenGate },
          preview_start_seconds: null,
          'field_visibility.remixes': false
        })
      }
    }
  }, [selected, selectedToken, coins, setFields])

  const selectedCoin =
    coins?.find((coin) => coin.mint === selectedToken?.token_mint) || coins?.[0]

  return (
    <ExpandableRadio
      value={StreamTrackAvailabilityType.TOKEN_GATED}
      label={messages.title}
      startAdornment={
        selectedCoin?.logoUri ? (
          <TokenIcon logoURI={selectedCoin.logoUri} size={spacing.xl} />
        ) : null
      }
      description={messages.description(
        selectedCoin?.ticker ?? messages.yourCoin
      )}
      disabled={disabled}
    />
  )
}
