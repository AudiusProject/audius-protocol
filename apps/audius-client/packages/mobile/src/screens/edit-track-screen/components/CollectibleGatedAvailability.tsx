import { useCallback, useEffect } from 'react'

import type { Nullable, PremiumConditions } from '@audius/common'
import { useField } from 'formik'
import { View, Image, Dimensions } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

import IconArrow from 'app/assets/images/iconArrow.svg'
import IconCaretRight from 'app/assets/images/iconCaretRight.svg'
import IconCollectible from 'app/assets/images/iconCollectible.svg'
import { Link, Text } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSetTrackAvailabilityFields } from 'app/hooks/useSetTrackAvailabilityFields'
import { makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'

const messages = {
  collectibleGated: 'Collectible Gated',
  collectibleGatedSubtitle:
    'Users who own a digital collectible matching your selection will have access to your track. Collectible gated content does not appear on trending or in user feeds.',
  learnMore: 'Learn More',
  pickACollection: 'Pick A Collection',
  ownersOf: 'Owners Of'
}

const LEARN_MORE_URL = ''

const screenWidth = Dimensions.get('screen').width

const useStyles = makeStyles(({ typography, spacing, palette }) => ({
  root: {
    width: screenWidth - spacing(22)
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
  learnMore: {
    marginTop: spacing(4),
    flexDirection: 'row',
    alignItems: 'center'
  },
  learnMoreText: {
    marginRight: spacing(0.5),
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.fontSize.small,
    color: palette.secondary
  },
  collectionContainer: {
    marginTop: spacing(4),
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(6),
    borderWidth: 1,
    borderColor: palette.neutralLight8,
    borderRadius: spacing(2)
  },
  pickACollection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  ownersOf: {
    marginTop: spacing(4),
    marginBottom: spacing(2),
    fontFamily: typography.fontByWeight.demiBold,
    fontSize: typography.fontSize.small
  },
  collection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing(2),
    backgroundColor: palette.neutralLight8,
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    borderRadius: spacing(2)
  },
  collectionName: {
    fontFamily: typography.fontByWeight.demiBold,
    fontSize: typography.fontSize.small
  },
  logo: {
    marginRight: spacing(1),
    borderWidth: 1,
    borderColor: palette.neutralLight8,
    borderRadius: spacing(1),
    width: spacing(5),
    height: spacing(5)
  }
}))

type TrackAvailabilitySelectionProps = {
  selected: boolean
  disabled?: boolean
}

export const CollectibleGatedAvailability = ({
  selected,
  disabled = false
}: TrackAvailabilitySelectionProps) => {
  const navigation = useNavigation()
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

  const { set: setTrackAvailabilityFields } = useSetTrackAvailabilityFields()
  const [{ value: premiumConditions }] =
    useField<Nullable<PremiumConditions>>('premium_conditions')
  const nftCollection = premiumConditions?.nft_collection ?? null

  // If collectible gated was not previously selected,
  // set as collectible gated and reset other fields.
  useEffect(() => {
    if (!('nft_collection' in (premiumConditions ?? {})) && selected) {
      setTrackAvailabilityFields(
        {
          is_premium: true,
          premium_conditions: { nft_collection: undefined }
        },
        true
      )
    }
  }, [premiumConditions, selected, setTrackAvailabilityFields])

  const handlePickACollection = useCallback(() => {
    navigation.navigate('NFTCollections')
  }, [navigation])

  return (
    <View style={styles.root}>
      <View style={styles.titleContainer}>
        <IconCollectible style={styles.titleIcon} fill={titleIconColor} />
        <Text weight='bold' style={titleStyles}>
          {messages.collectibleGated}
        </Text>
      </View>
      <View style={styles.subtitleContainer}>
        <Text fontSize='medium' weight='medium' style={styles.subtitle}>
          {messages.collectibleGatedSubtitle}
        </Text>
      </View>
      <Link url={LEARN_MORE_URL} style={styles.learnMore}>
        <Text style={styles.learnMoreText}>{messages.learnMore}</Text>
        <IconArrow fill={secondary} width={16} height={16} />
      </Link>
      {selected && (
        <TouchableOpacity
          onPress={handlePickACollection}
          style={styles.collectionContainer}
        >
          <View style={styles.pickACollection}>
            <Text weight='demiBold' fontSize='large'>
              {messages.pickACollection}
            </Text>
            <IconCaretRight fill={neutralLight4} width={16} height={16} />
          </View>
          {nftCollection && (
            <View>
              <Text style={styles.ownersOf}>{messages.ownersOf}</Text>
              <View style={styles.collection}>
                {nftCollection.imageUrl && (
                  <Image
                    source={{ uri: nftCollection.imageUrl }}
                    style={styles.logo}
                  />
                )}
                <Text style={styles.collectionName}>{nftCollection.name}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  )
}
