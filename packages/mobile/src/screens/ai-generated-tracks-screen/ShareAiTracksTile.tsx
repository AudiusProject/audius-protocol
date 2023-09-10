import { View, Image } from 'react-native'

import RobotFace from 'app/assets/images/robotFace.png'
import { Text, Link } from 'app/components/core'
import { makeStyles, shadow } from 'app/styles'

const AUDIUS_AI_BLOG_LINK =
  'https://help.audius.co/help/What-should-I-know-about-AI-generated-music-on-Audius-0a5a8'

const messages = {
  title: 'Share Your AI-Generated Tracks',
  description:
    "Join in by uploading your own AI-made tracks! Just mark them as AI-Generated during the upload process and tag the artist you'd like to credit.",
  learnMore: 'Learn More'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    marginVertical: spacing(4),
    marginHorizontal: spacing(3),
    padding: spacing(6),
    borderWidth: 1,
    borderRadius: spacing(2),
    backgroundColor: palette.white,
    borderColor: palette.neutralLight7,
    ...shadow()
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(4)
  },
  robotImage: {
    height: spacing(16),
    width: spacing(16)
  },
  titleText: {
    marginRight: spacing(25),
    ...typography.h1,
    lineHeight: typography.h1.fontSize * 1.3,
    marginVertical: spacing(2)
  },
  description: {
    fontSize: typography.fontSize.medium,
    lineHeight: typography.body.fontSize * 1.3,
    marginVertical: spacing(4)
  },
  learnMoreLink: {
    alignSelf: 'flex-start'
  },
  learnMore: {
    fontSize: typography.fontSize.medium,
    lineHeight: typography.body.fontSize * 1.2,
    color: palette.secondary
  }
}))

export const ShareAiTracksTile = () => {
  const styles = useStyles()
  return (
    <View style={styles.root}>
      <View style={styles.title}>
        <Image style={styles.robotImage} source={RobotFace} />
        <Text style={styles.titleText}>{messages.title}</Text>
      </View>
      <Text style={styles.description}>{messages.description}</Text>
      <Link url={AUDIUS_AI_BLOG_LINK} style={styles.learnMoreLink}>
        <Text style={styles.learnMore}>{messages.learnMore}</Text>
      </Link>
    </View>
  )
}
