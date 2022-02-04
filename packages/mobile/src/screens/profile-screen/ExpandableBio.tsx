import { useCallback, useState } from 'react'

import { ProfileUser } from 'audius-client/src/pages/profile-page/store/types'
import {
  Pressable,
  View,
  Text,
  LayoutChangeEvent,
  LayoutAnimation
} from 'react-native'
import { useToggle } from 'react-use'

import { makeStyles } from 'app/styles/makeStyles'

import { Sites } from './Sites'

const messages = {
  showMore: 'show more',
  showLess: 'show less'
}

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
  root: {
    marginTop: spacing(5)
  },
  bio: {
    ...typography.body,
    color: palette.neutralLight2
  },
  expandButton: {
    marginTop: spacing(2),
    backgroundColor: 'white'
  },
  expandText: {
    ...typography.h2,
    color: palette.primary,
    textTransform: 'capitalize'
  }
}))

type ExpandableBioProps = {
  profile: ProfileUser
}

export const ExpandableBio = ({ profile }: ExpandableBioProps) => {
  const { bio, website, donation } = profile
  const styles = useStyles()
  const [fullBioHeight, setFullBioHeight] = useState(0)
  const hasSites = Boolean(website || donation) || true
  const [shouldShowMore, setShouldShowMore] = useState(hasSites)
  const [isExpanded, setIsExpanded] = useToggle(false)

  const handleBioLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout
      if (!fullBioHeight) {
        setFullBioHeight(height)
      } else if (fullBioHeight > height) {
        setShouldShowMore(true)
      }
    },
    [fullBioHeight]
  )

  const handleToggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setIsExpanded(!isExpanded)
  }, [isExpanded, setIsExpanded])

  return (
    <View style={styles.root}>
      <View>
        <Text
          numberOfLines={fullBioHeight && !isExpanded ? 1 : 0}
          style={styles.bio}
          onLayout={handleBioLayout}
        >
          {bio}
        </Text>
        {hasSites && isExpanded ? <Sites profile={profile} /> : null}
      </View>
      {shouldShowMore ? (
        <View style={styles.expandButton}>
          <Pressable onPress={handleToggleExpanded}>
            <Text style={styles.expandText}>
              {isExpanded ? messages.showLess : messages.showMore}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}
