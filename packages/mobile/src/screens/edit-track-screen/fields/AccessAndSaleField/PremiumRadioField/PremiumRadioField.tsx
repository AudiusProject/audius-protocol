import { useCallback, useEffect, useMemo, useRef } from 'react'

import { FeatureFlags } from '@audius/common'
import { useFeatureFlag } from '@audius/common/hooks'
import { Name, isContentUSDCPurchaseGated } from '@audius/common/models'
import { useField } from 'formik'
import { Dimensions, View } from 'react-native'

import IconCart from 'app/assets/images/iconCart.svg'
import IconStars from 'app/assets/images/iconStars.svg'
import { Link, Tag, Text } from 'app/components/core'
import { HelpCallout } from 'app/components/help-callout/HelpCallout'
import { useSetTrackAvailabilityFields } from 'app/hooks/useSetTrackAvailabilityFields'
import { make, track } from 'app/services/analytics'
import { makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'

import type { TrackAvailabilitySelectionProps } from '../../../components/types'

import { TRACK_PREVIEW, TrackPreviewField } from './TrackPreviewField'
import { TrackPriceField } from './TrackPriceField'

const WAITLIST_TYPEFORM = 'https://link.audius.co/waitlist'

type PremiumRadioFieldProps = TrackAvailabilitySelectionProps

const screenWidth = Dimensions.get('screen').width

const messages = {
  title: 'Premium (Pay to Unlock)',
  description:
    'Unlockable by purchase, these tracks are visible to everyone but only playable by users who have paid for access.',
  waitlist:
    'Start selling your music on Audius today! Limited access beta now available.',
  join: 'Join the Waitlist',
  comingSoon: 'Coming Soon'
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    width: screenWidth - spacing(22),
    gap: spacing(4)
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  title: {
    fontSize: 18,
    marginTop: 0
  },
  selectedTitle: {
    color: palette.secondary
  },
  disabledTitle: {
    color: palette.neutralLight4
  },
  titleIcon: {
    marginTop: 0,
    marginRight: spacing(2.5)
  },
  subtitleContainer: {
    marginLeft: -1 * spacing(10)
  },
  subtitle: {
    color: palette.neutral
  },
  waitlist: {
    gap: spacing(3),
    alignItems: 'flex-start'
  },
  link: {
    color: palette.secondary
  },
  comingSoon: {
    alignSelf: 'flex-start'
  },
  fields: {
    marginLeft: -1 * spacing(10)
  }
}))

export const PremiumRadioField = (props: PremiumRadioFieldProps) => {
  const { isEnabled: isUsdcUploadEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES_UPLOAD
  )
  const { selected, disabled, previousStreamConditions } = props
  const { set: setTrackAvailabilityFields } = useSetTrackAvailabilityFields()
  const styles = useStyles()

  const handlePressWaitListLink = useCallback(() => {
    track(make({ eventName: Name.TRACK_UPLOAD_CLICK_USDC_WAITLIST_LINK }))
  }, [])

  const secondary = useColor('secondary')
  const neutral = useColor('neutral')
  const neutralLight4 = useColor('neutralLight4')

  const titleStyles: object[] = [styles.title]
  if (selected) {
    titleStyles.push(styles.selectedTitle)
  } else if (disabled) {
    titleStyles.push(styles.disabledTitle)
  }

  const titleIconColor = selected
    ? secondary
    : disabled
    ? neutralLight4
    : neutral

  const selectedUsdcPurchaseValue = useMemo(() => {
    if (isContentUSDCPurchaseGated(previousStreamConditions)) {
      return previousStreamConditions.usdc_purchase
    }
    return { price: null }
  }, [previousStreamConditions])
  const [{ value: preview }] = useField(TRACK_PREVIEW)
  const previewStartSeconds = useRef(preview ?? 0).current

  useEffect(() => {
    if (selected) {
      setTrackAvailabilityFields({
        is_stream_gated: true,
        // @ts-ignore fully formed in saga (validated + added splits)
        stream_conditions: { usdc_purchase: selectedUsdcPurchaseValue },
        preview_start_seconds: previewStartSeconds,
        'field_visibility.remixes': false
      })
    }
  }, [
    selected,
    previewStartSeconds,
    selectedUsdcPurchaseValue,
    setTrackAvailabilityFields
  ])

  const renderHelpCalloutContent = useCallback(() => {
    return (
      <View style={styles.waitlist}>
        <Text>{messages.waitlist}</Text>
        <Link url={WAITLIST_TYPEFORM} onPress={handlePressWaitListLink}>
          <Text style={styles.link}>{messages.join}</Text>
        </Link>
      </View>
    )
  }, [styles.link, styles.waitlist, handlePressWaitListLink])

  return (
    <View style={styles.root}>
      <View style={styles.titleContainer}>
        <IconCart style={styles.titleIcon} fill={titleIconColor} />
        <Text weight='bold' style={titleStyles}>
          {messages.title}
        </Text>
      </View>
      {selected ? (
        <View style={styles.subtitleContainer}>
          <Text fontSize='medium' weight='medium' style={styles.subtitle}>
            {messages.description}
          </Text>
        </View>
      ) : null}
      {!isUsdcUploadEnabled ? (
        <>
          <Tag style={styles.comingSoon}>{messages.comingSoon}</Tag>
          <HelpCallout
            icon={IconStars}
            style={styles.waitlist}
            content={renderHelpCalloutContent()}
          />
        </>
      ) : null}
      {selected ? (
        <View style={styles.fields}>
          <TrackPriceField />
          <TrackPreviewField />
        </View>
      ) : null}
    </View>
  )
}
