import { View } from 'react-native'

import { IconDownload } from '@audius/harmony-native'
import { Button, GradientText, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing }) => ({
  contentContainer: {
    paddingTop: spacing(32),
    paddingBottom: spacing(8),
    paddingHorizontal: spacing(6)
  },
  header: {
    fontSize: 24,
    lineHeight: 52,
    textAlign: 'center',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 4,
    textShadowColor: 'rgba(162,47,235,0.2)'
  },
  text: {
    textAlign: 'center',
    marginBottom: spacing(8),
    marginTop: spacing(6)
  }
}))

type NewVersionPromptProps = {
  headerText: string
  contentText: string
  buttonText: string
  /** Passing a `url` will make the CTA element a link */
  url?: string
  /** Passing an `onPress` callback will make the CTA element a Pressable */
  onPress?: () => void
}

export const NewVersionPrompt = ({
  headerText,
  contentText,
  buttonText,
  url,
  onPress
}: NewVersionPromptProps) => {
  const styles = useStyles()

  return (
    <View style={styles.contentContainer}>
      <GradientText accessibilityRole='header' style={styles.header}>
        {headerText}
      </GradientText>
      <Text variant='h1' style={styles.text}>
        {contentText}
      </Text>
      {!url && !onPress ? null : (
        <Button
          title={buttonText}
          size='large'
          icon={IconDownload}
          iconPosition='left'
          url={url}
          onPress={onPress}
        />
      )}
    </View>
  )
}
