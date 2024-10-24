import { vipDiscordModalActions } from '@audius/common/store'
import type { ImageSourcePropType } from 'react-native'
import { View, Image } from 'react-native'
import { useDispatch } from 'react-redux'

import {
  Button,
  Flex,
  IconArrowRight,
  IconDiscord,
  useTheme,
  Text
} from '@audius/harmony-native'
import Hole from 'app/assets/images/emojis/hole.png'
import Rabbit from 'app/assets/images/emojis/rabbit.png'
import Sparkles from 'app/assets/images/emojis/sparkles.png'
import Checkmark from 'app/assets/images/emojis/white-heavy-check-mark.png'
import { GradientText, Shadow } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'
const { pressDiscord } = vipDiscordModalActions

const messages = {
  tier: 'Tier',
  minAmount: '$AUDIO',
  current: 'Current Tier',
  unlocks: 'Unlocks',
  updateRole: 'Update Role'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    width: '100%',
    marginVertical: spacing(8)
  },
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(4),
    borderColor: palette.neutralLight7,
    borderWidth: 2,
    borderRadius: spacing(4),
    backgroundColor: palette.neutralLight10,
    flexDirection: 'column'
  },
  current: {
    borderColor: palette.secondary,
    borderWidth: 4
  },
  currentIndicator: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  currentText: {
    color: palette.secondary,
    fontFamily: typography.fontByWeight.heavy,
    fontSize: typography.fontSize.medium,
    textTransform: 'uppercase'
  },
  currentPointer: {
    transform: [{ rotate: '90deg' }],
    marginBottom: spacing(2)
  },
  title: {
    margin: 8,
    fontFamily: typography.fontByWeight.heavy,
    fontSize: 28,
    textTransform: 'uppercase'
  },
  separator: {
    height: 1,
    width: 80,
    backgroundColor: palette.neutralLight6,
    marginVertical: 24
  }
}))

const Unlock = ({ images, children }) => {
  const { spacing } = useTheme()
  return (
    <Text variant='body' size='l' strength='strong' textTransform='capitalize'>
      {images.map((image, i) => (
        <>
          <Image
            key={i}
            source={image}
            style={{ height: spacing.l, width: spacing.l }}
          />{' '}
        </>
      ))}
      {children}
    </Text>
  )
}

type TierProps = {
  tierNumber: number
  title: string
  gradientColors: string[]
  minAmount: number
  imageSource: ImageSourcePropType
  isCurrentTier: boolean
  unlocks?: 'matrix'[]
}

export const Tier = (props: TierProps) => {
  const {
    tierNumber,
    title,
    gradientColors,
    minAmount,
    imageSource,
    isCurrentTier,
    unlocks = []
  } = props
  const styles = useStyles()
  const { secondary } = useThemeColors()
  const dispatch = useDispatch()

  const renderTierBody = () => {
    return (
      <>
        <View style={[styles.container, isCurrentTier && styles.current]}>
          <Text
            variant='label'
            size='l'
            color='subdued'
          >{`${messages.tier} ${tierNumber}`}</Text>
          <GradientText style={styles.title} colors={gradientColors}>
            {title}
          </GradientText>
          <Text
            variant='title'
            size='s'
            color='accent'
          >{`${minAmount}+ ${messages.minAmount}`}</Text>
          <View style={styles.separator} />
          <Image source={imageSource} style={{ height: 108, width: 108 }} />
          <Flex mt='xl' gap='l'>
            <Text variant='label' size='l' color='subdued' textAlign='center'>
              {messages.unlocks}
            </Text>
            <Unlock images={[Checkmark]}>{title} Badge</Unlock>
            <Unlock images={[Checkmark]}>{title} Discord Role</Unlock>
            <Unlock images={[Checkmark]}>Message Blasts</Unlock>
            {isCurrentTier ? (
              <Button
                variant='secondary'
                onPress={() => dispatch(pressDiscord())}
                iconLeft={IconDiscord}
              >
                {messages.updateRole}
              </Button>
            ) : null}
            {unlocks.map((unlock) => {
              switch (unlock) {
                case 'matrix':
                  return (
                    <Unlock key={unlock} images={[Rabbit, Hole]}>
                      Matrix Mode
                    </Unlock>
                  )
                default:
                  return null
              }
            })}
            <Unlock images={[Sparkles]}>More Coming Soon</Unlock>
          </Flex>
        </View>
      </>
    )
  }

  return isCurrentTier ? (
    <View style={styles.root}>
      <View style={styles.currentIndicator}>
        <Text style={styles.currentText}>{messages.current}</Text>
        <IconArrowRight
          height={20}
          width={20}
          style={styles.currentPointer}
          fill={secondary}
        />
      </View>
      <Shadow
        offset={{ height: 0, width: 0 }}
        radius={spacing(2)}
        color='rgb(162,47,235)'
        opacity={0.4}
      >
        {renderTierBody()}
      </Shadow>
    </View>
  ) : (
    <View style={styles.root}>{renderTierBody()}</View>
  )
}
