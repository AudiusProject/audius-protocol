import { useCallback, useEffect } from 'react'

import { Dimensions, View } from 'react-native'

import IconCart from 'app/assets/images/iconCart.svg'
import IconStars from 'app/assets/images/iconStars.svg'
import { Link, Tag, Text } from 'app/components/core'
import { HelpCallout } from 'app/components/help-callout/HelpCallout'
import { useSetTrackAvailabilityFields } from 'app/hooks/useSetTrackAvailabilityFields'
import { makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'

import type { TrackAvailabilitySelectionProps } from '../../../components/types'

import { TrackPreviewField } from './TrackPreviewField'
import { TrackPriceField } from './TrackPriceField'

const WAITLIST_TYPEFORM = 'https://example.com'

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
    fontSize: 22,
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
    marginTop: spacing(2)
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
  }
}))

export const PremiumRadioField = (props: PremiumRadioFieldProps) => {
  const { selected, disabled } = props
  const { set: setTrackAvailabilityFields } = useSetTrackAvailabilityFields()
  const styles = useStyles()

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

  useEffect(() => {
    if (selected) {
      setTrackAvailabilityFields({
        is_premium: true,
        premium_conditions: { usdc_purchase: { price: 0, splits: {} } },
        preview_start_seconds: 0,
        'field_visibility.remixes': false
      })
    }
  }, [selected, setTrackAvailabilityFields])

  const renderHelpCalloutContent = useCallback(() => {
    return (
      <View style={styles.waitlist}>
        <Text>{messages.waitlist}</Text>
        <Link url={WAITLIST_TYPEFORM}>
          <Text style={styles.link}>{messages.join}</Text>
        </Link>
      </View>
    )
  }, [])

  return (
    <View style={styles.root}>
      <View style={styles.titleContainer}>
        <IconCart style={styles.titleIcon} fill={titleIconColor} />
        <Text weight='bold' style={titleStyles}>
          {messages.title}
        </Text>
      </View>
      <View style={styles.subtitleContainer}>
        <Text fontSize='medium' weight='medium' style={styles.subtitle}>
          {messages.description}
        </Text>
      </View>
      {disabled ? (
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
        <>
          <TrackPriceField />
          <TrackPreviewField />
        </>
      ) : null}
    </View>
  )
}
