import { useMemo } from 'react'

import {
  isContentCollectibleGated,
  isContentUSDCPurchaseGated,
  type AccessConditions,
  GatedContentType
} from '@audius/common'
import { View } from 'react-native'

import { IconCart } from '@audius/harmony-native'
import { IconCollectible } from '@audius/harmony-native'
import { IconSpecialAccess } from '@audius/harmony-native'
import { Text } from 'app/components/core'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { makeStyles, flexRowCentered } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  collectibleGated: 'Collectible Gated',
  specialAccess: 'Special Access',
  premium: 'Premium'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    ...flexRowCentered(),
    gap: spacing(1)
  }
}))

type LineupTileGatedContentTypeTagProps = {
  streamConditions: AccessConditions
  hasStreamAccess?: boolean
  isOwner: boolean
}

/**
 * Returns a tag that indicates the type of stream content
 * @param streamConditions the track's stream conditions
 * @param hasStreamAccess whether the user has access to stream the track
 * @isOwner whether the user is the owner of the track
 */
export const LineupTileGatedContentTypeTag = ({
  streamConditions,
  hasStreamAccess,
  isOwner
}: LineupTileGatedContentTypeTagProps) => {
  const styles = useStyles()
  const { accentBlue, neutralLight4, specialLightGreen } = useThemeColors()
  const isUSDCEnabled = useIsUSDCEnabled()

  const type =
    isUSDCEnabled && isContentUSDCPurchaseGated(streamConditions)
      ? GatedContentType.USDC_PURCHASE
      : isContentCollectibleGated(streamConditions)
      ? GatedContentType.COLLECTIBLE_GATED
      : GatedContentType.SPECIAL_ACCESS

  const gatedContentTypeMap = useMemo(() => {
    return {
      [GatedContentType.COLLECTIBLE_GATED]: {
        icon: IconCollectible,
        color: hasStreamAccess && !isOwner ? neutralLight4 : accentBlue,
        text: messages.collectibleGated
      },
      [GatedContentType.SPECIAL_ACCESS]: {
        icon: IconSpecialAccess,
        color: hasStreamAccess && !isOwner ? neutralLight4 : accentBlue,
        text: messages.specialAccess
      },
      [GatedContentType.USDC_PURCHASE]: {
        icon: IconCart,
        color: hasStreamAccess && !isOwner ? neutralLight4 : specialLightGreen,
        text: messages.premium
      }
    }
  }, [accentBlue, hasStreamAccess, isOwner, neutralLight4, specialLightGreen])

  const { icon: Icon, color, text } = gatedContentTypeMap[type]

  return (
    <View style={styles.root}>
      <Icon fill={color} height={spacing(4)} width={spacing(4)} />
      <Text fontSize='xs' colorValue={color}>
        {text}
      </Text>
    </View>
  )
}
