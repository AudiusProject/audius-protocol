import { useContext, useEffect, useMemo, useRef } from 'react'

import { priceAndAudienceMessages } from '@audius/common/messages'
import type { AccessConditions } from '@audius/common/models'
import {
  isContentUSDCPurchaseGated,
  StreamTrackAvailabilityType
} from '@audius/common/models'
import type { Nullable } from '@audius/common/utils'
import { useField } from 'formik'

import { Flex, IconCart, RadioGroupContext } from '@audius/harmony-native'
import { useSetEntityAvailabilityFields } from 'app/hooks/useSetTrackAvailabilityFields'
import { ExpandableRadio } from '../../ExpandableRadio'

import { TRACK_PREVIEW, TrackPreviewField } from './TrackPreviewField'
import { TrackPriceField } from './TrackPriceField'
import { AlbumPriceField } from './AlbumPriceField'

type PremiumRadioFieldProps = {
  disabled?: boolean
  previousStreamConditions: Nullable<AccessConditions>
}

const { premiumRadio: messages } = priceAndAudienceMessages

export const PremiumRadioField = (props: PremiumRadioFieldProps) => {
  const { disabled, previousStreamConditions } = props
  const { set: setFields } = useSetEntityAvailabilityFields()

  const { value } = useContext(RadioGroupContext)
  const selected = value === StreamTrackAvailabilityType.USDC_PURCHASE

  const selectedUsdcPurchaseValue = useMemo(() => {
    if (isContentUSDCPurchaseGated(previousStreamConditions)) {
      return previousStreamConditions.usdc_purchase
    }
    return { price: null }
  }, [previousStreamConditions])

  const [{ value: preview }] = useField(TRACK_PREVIEW)
  const previewStartSeconds = useRef(preview ?? 0).current
  const [{ value: entityType }] = useField('entityType')

  useEffect(() => {
    if (selected) {
      setFields({
        is_stream_gated: true,
        // @ts-ignore fully formed in saga (validated + added splits)
        stream_conditions: { usdc_purchase: selectedUsdcPurchaseValue },
        preview_start_seconds: previewStartSeconds,
        'field_visibility.remixes': false
      })
    }
  }, [selected, previewStartSeconds, selectedUsdcPurchaseValue, setFields])

  return (
    <ExpandableRadio
      value={StreamTrackAvailabilityType.USDC_PURCHASE}
      label={messages.title}
      icon={IconCart}
      description={messages.description[entityType]}
      disabled={disabled}
      checkedContent={
        <Flex>
          {entityType === 'track' ? (
            <>
              <TrackPriceField />
              <TrackPreviewField />
            </>
          ) : (
            <AlbumPriceField />
          )}
        </Flex>
      }
    />
  )
}
