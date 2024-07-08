import { useCallback } from 'react'

import { TouchableOpacity, View } from 'react-native'
import { useDispatch } from 'react-redux'

import {
  IconArrowRight,
  IconExternalLink,
  IconRocket
} from '@audius/harmony-native'
import { Button, Text, useLink } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import { useNavigation } from 'app/hooks/useNavigation'
import { setVisibility } from 'app/store/drawers/slice'
import { flexRowCentered, makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'

const LEARN_MORE_URL =
  'https://blog.audius.co/article/guide-to-audius-availability-settings'

const messages = {
  title: 'NEW UPDATE!',
  subtitle: 'Control who has access to your tracks!',
  description:
    'Availability settings allow you to limit access to specific groups of users or offer exclusive content to your most dedicated fans.',
  learnMore: 'Learn More',
  gotIt: 'Got It',
  checkItOut: 'Check It Out'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  drawer: {
    marginVertical: spacing(8),
    marginHorizontal: spacing(4),
    alignItems: 'flex-start'
  },
  titleContainer: {
    ...flexRowCentered(),
    justifyContent: 'center',
    width: '100%',
    paddingBottom: spacing(4),
    marginBottom: spacing(6),
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight8
  },
  titleText: {
    marginLeft: spacing(3),
    fontFamily: typography.fontByWeight.heavy,
    fontSize: typography.fontSize.medium,
    color: palette.neutralLight4
  },
  subtitle: {
    marginBottom: spacing(6),
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.fontSize.large
  },
  description: {
    marginBottom: spacing(6),
    fontFamily: typography.fontByWeight.medium,
    fontSize: typography.fontSize.large,
    lineHeight: spacing(7)
  },
  button: {
    marginBottom: spacing(6)
  },
  buttonText: {
    fontSize: typography.fontSize.large
  },
  learnMore: {
    ...flexRowCentered(),
    marginBottom: spacing(6)
  },
  learnMoreIcon: {
    marginLeft: spacing(1)
  }
}))

export const GatedContentUploadPromptDrawer = ({
  isUpload
}: {
  isUpload?: boolean
}) => {
  const styles = useStyles()
  const neutralLight4 = useColor('neutralLight4')
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const { onPress: onLearnMorePress } = useLink(LEARN_MORE_URL)

  const handleClose = useCallback(() => {
    dispatch(
      setVisibility({ drawer: 'GatedContentUploadPrompt', visible: false })
    )
  }, [dispatch])

  const handleSubmit = useCallback(() => {
    handleClose()
    navigation.push('Availability')
  }, [handleClose, navigation])

  if (!isUpload) return null

  return (
    <NativeDrawer drawerName='GatedContentUploadPrompt'>
      <View style={styles.drawer}>
        <View style={styles.titleContainer}>
          <IconRocket fill={neutralLight4} width={24} height={24} />
          <Text style={styles.titleText} weight='heavy' color='neutral'>
            {messages.title}
          </Text>
        </View>
        <Text style={styles.subtitle}>{messages.subtitle}</Text>
        <Text style={styles.description}>{messages.description}</Text>
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
        <Button
          title={messages.gotIt}
          onPress={handleClose}
          variant='commonAlt'
          size='large'
          styles={{
            root: styles.button,
            text: styles.buttonText
          }}
          fullWidth
        />
        <Button
          title={messages.checkItOut}
          onPress={handleSubmit}
          styles={{
            root: styles.button,
            text: styles.buttonText
          }}
          size='large'
          icon={IconArrowRight}
          fullWidth
        />
      </View>
    </NativeDrawer>
  )
}
