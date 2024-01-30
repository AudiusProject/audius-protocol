import { useCallback, useEffect, useState } from 'react'

import type { Nullable } from '@audius/common'
import { collectiblesSelectors } from '@audius/common'
import { isContentCollectibleGated } from '@audius/common/models'
import type { AccessConditions } from '@audius/common/models'
import { useField } from 'formik'
import { View, Image, Dimensions } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useSelector } from 'react-redux'

import IconCaretRight from 'app/assets/images/iconCaretRight.svg'
import IconCollectible from 'app/assets/images/iconCollectible.svg'
import IconExternalLink from 'app/assets/images/iconExternalLink.svg'
import { Text, useLink } from 'app/components/core'
import { HelpCallout } from 'app/components/help-callout/HelpCallout'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSetTrackAvailabilityFields } from 'app/hooks/useSetTrackAvailabilityFields'
import { flexRowCentered, makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'

import type { TrackAvailabilitySelectionProps } from './types'

const messages = {
  collectibleGated: 'Collectible Gated',
  collectibleGatedSubtitle:
    'Users who own a digital collectible matching your selection will have access to your track. Collectible gated content does not appear on trending or in user feeds.',
  learnMore: 'Learn More',
  pickACollection: 'Pick A Collection',
  ownersOf: 'Owners Of',
  noCollectibles:
    'No Collectibles found. To enable this option, link a wallet containing a collectible.',
  compatibilityTitle: "Not seeing what you're looking for?",
  compatibilitySubtitle:
    'Unverified Solana NFT Collections are not compatible at this time.'
}

const LEARN_MORE_URL =
  'https://blog.audius.co/article/introducing-nft-collectible-gated-content'

const { getSupportedUserCollections, getHasUnsupportedCollection } =
  collectiblesSelectors

const screenWidth = Dimensions.get('screen').width

const useStyles = makeStyles(({ typography, spacing, palette }) => ({
  root: {
    width: screenWidth - spacing(22)
  },
  titleContainer: {
    ...flexRowCentered()
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
    marginTop: spacing(4),
    marginLeft: -1 * spacing(10)
  },
  subtitle: {
    color: palette.neutral
  },
  learnMore: {
    marginTop: spacing(4),
    ...flexRowCentered()
  },
  learnMoreText: {
    marginRight: spacing(1),
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.fontSize.large,
    color: palette.neutralLight4
  },
  selectionContainer: {
    marginLeft: spacing(-10),
    marginTop: spacing(4),
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(6),
    borderWidth: 1,
    borderColor: palette.neutralLight8,
    borderRadius: spacing(2)
  },
  pickACollection: {
    ...flexRowCentered(),
    justifyContent: 'space-between'
  },
  ownersOf: {
    marginTop: spacing(4),
    marginBottom: spacing(2),
    fontFamily: typography.fontByWeight.demiBold,
    fontSize: typography.fontSize.small
  },
  collection: {
    ...flexRowCentered(),
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
  },
  noCollectibles: {
    marginTop: spacing(4)
  },
  noCollectiblesText: {
    flex: 1,
    flexWrap: 'wrap'
  },
  questionIcon: {
    marginRight: spacing(4),
    width: spacing(5),
    height: spacing(5)
  },
  learnMoreIcon: {
    marginLeft: spacing(1)
  }
}))

export const CollectibleGatedAvailability = ({
  selected,
  disabled = false,
  disabledContent = false,
  previousStreamConditions
}: TrackAvailabilitySelectionProps) => {
  const navigation = useNavigation()
  const styles = useStyles()
  const secondary = useColor('secondary')
  const neutral = useColor('neutral')
  const neutralLight4 = useColor('neutralLight4')
  const { onPress: onLearnMorePress } = useLink(LEARN_MORE_URL)

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

  const { ethCollectionMap, solCollectionMap } = useSelector(
    getSupportedUserCollections
  )
  const hasUnsupportedCollection = useSelector(getHasUnsupportedCollection)
  const numEthCollectibles = Object.keys(ethCollectionMap).length
  const numSolCollectibles = Object.keys(solCollectionMap).length
  const hasNoCollectibles = numEthCollectibles + numSolCollectibles === 0

  const { set: setTrackAvailabilityFields } = useSetTrackAvailabilityFields()
  const [{ value: streamConditions }] =
    useField<Nullable<AccessConditions>>('stream_conditions')
  const [selectedNFTCollection, setSelectedNFTCollection] = useState(
    isContentCollectibleGated(previousStreamConditions)
      ? previousStreamConditions.nft_collection
      : undefined
  )

  // Update nft collection gate when availability selection changes
  useEffect(() => {
    if (selected) {
      setTrackAvailabilityFields(
        {
          is_stream_gated: true,
          stream_conditions: { nft_collection: selectedNFTCollection },
          'field_visibility.remixes': false
        },
        true
      )
    }
  }, [selected, selectedNFTCollection, setTrackAvailabilityFields])

  // Update nft collection gate when nft collection selection changes
  useEffect(() => {
    if (isContentCollectibleGated(streamConditions)) {
      setSelectedNFTCollection(streamConditions.nft_collection)
    }
  }, [streamConditions])

  const handlePickACollection = useCallback(() => {
    navigation.navigate('NFTCollections')
  }, [navigation])

  const renderHelpCalloutContent = useCallback(() => {
    return hasUnsupportedCollection ? (
      <View>
        <Text>{messages.compatibilityTitle}</Text>
        <Text>{messages.compatibilitySubtitle}</Text>
      </View>
    ) : (
      messages.noCollectibles
    )
  }, [hasUnsupportedCollection])

  return (
    <View style={styles.root}>
      <View style={styles.titleContainer}>
        <IconCollectible style={styles.titleIcon} fill={titleIconColor} />
        <Text weight='bold' style={titleStyles}>
          {messages.collectibleGated}
        </Text>
      </View>
      {selected ? (
        <View style={styles.subtitleContainer}>
          <Text fontSize='medium' weight='medium' style={styles.subtitle}>
            {messages.collectibleGatedSubtitle}
          </Text>
        </View>
      ) : null}
      {hasNoCollectibles ? (
        <HelpCallout
          style={styles.noCollectibles}
          content={renderHelpCalloutContent()}
        />
      ) : null}
      <TouchableOpacity style={styles.learnMore} onPress={onLearnMorePress}>
        <Text weight='bold' color='neutralLight4' fontSize='large'>
          {messages.learnMore}
        </Text>
        <IconExternalLink
          style={styles.learnMoreIcon}
          width={20}
          height={20}
          fill={neutralLight4}
        />
      </TouchableOpacity>
      {selected && (
        <TouchableOpacity
          onPress={handlePickACollection}
          style={styles.selectionContainer}
          disabled={disabled || disabledContent}
        >
          <View style={styles.pickACollection}>
            <Text weight='demiBold' fontSize='large'>
              {messages.pickACollection}
            </Text>
            <IconCaretRight fill={neutralLight4} width={16} height={16} />
          </View>
          {isContentCollectibleGated(streamConditions) && (
            <View>
              <Text style={styles.ownersOf}>{messages.ownersOf}</Text>
              <View style={styles.collection}>
                {streamConditions.nft_collection?.imageUrl && (
                  <Image
                    source={{ uri: streamConditions.nft_collection.imageUrl }}
                    style={styles.logo}
                  />
                )}
                <Text style={styles.collectionName}>
                  {streamConditions.nft_collection?.name}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  )
}
