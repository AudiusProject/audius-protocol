import { useCallback, useContext, useEffect, useState } from 'react'

import { useHasNoCollectibles } from '@audius/common/hooks'
import { priceAndAudienceMessages } from '@audius/common/messages'
import {
  isContentCollectibleGated,
  StreamTrackAvailabilityType
} from '@audius/common/models'
import type { AccessConditions } from '@audius/common/models'
import type { Nullable } from '@audius/common/utils'
import { useField } from 'formik'
import { Image, Pressable } from 'react-native'

import {
  Box,
  Flex,
  Hint,
  IconExternalLink,
  PlainButton,
  RadioGroupContext,
  TextInput,
  useTheme
} from '@audius/harmony-native'
import { useLink } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSetEntityAvailabilityFields } from 'app/hooks/useSetTrackAvailabilityFields'

import { ExpandableRadio } from '../ExpandableRadio'

const { collectibleGatedRadio: messages } = priceAndAudienceMessages

const LEARN_MORE_URL =
  'https://blog.audius.co/article/introducing-nft-collectible-gated-content'

type CollectibleGatedRadioFieldProps = {
  disabled?: boolean
  previousStreamConditions: Nullable<AccessConditions>
}

export const CollectibleGatedRadioField = (
  props: CollectibleGatedRadioFieldProps
) => {
  const { disabled, previousStreamConditions } = props
  const { value } = useContext(RadioGroupContext)
  const selected = value === StreamTrackAvailabilityType.COLLECTIBLE_GATED
  const navigation = useNavigation()
  const { color, cornerRadius, spacing } = useTheme()
  const { onPress: onLearnMorePress } = useLink(LEARN_MORE_URL)

  const hasNoCollectibles = useHasNoCollectibles()

  const { set: setTrackAvailabilityFields } = useSetEntityAvailabilityFields()
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

  return (
    <ExpandableRadio
      value={StreamTrackAvailabilityType.COLLECTIBLE_GATED}
      label={messages.title}
      description={messages.description}
      disabled={disabled}
      checkedContent={
        <Flex gap='l'>
          {hasNoCollectibles ? (
            <Hint mt='l'>{messages.noCollectibles}</Hint>
          ) : null}
          <Box alignSelf='flex-start'>
            <PlainButton
              iconRight={IconExternalLink}
              variant='subdued'
              onPress={onLearnMorePress}
            >
              {messages.learnMore}
            </PlainButton>
          </Box>
          {hasNoCollectibles ? null : (
            <Pressable onPress={handlePickACollection}>
              <TextInput
                startIcon={() =>
                  isContentCollectibleGated(streamConditions) &&
                  streamConditions.nft_collection?.imageUrl ? (
                    <Image
                      source={{
                        uri: streamConditions.nft_collection.imageUrl
                      }}
                      style={{
                        borderWidth: 1,
                        borderColor: color.border.default,
                        borderRadius: cornerRadius.s,
                        width: spacing['2xl'],
                        height: spacing['2xl']
                      }}
                    />
                  ) : null
                }
                value={
                  isContentCollectibleGated(streamConditions)
                    ? streamConditions.nft_collection?.name
                    : ''
                }
                label={messages.pickACollection}
                readOnly
                _disablePointerEvents
              />
            </Pressable>
          )}
        </Flex>
      }
    />
  )
}
