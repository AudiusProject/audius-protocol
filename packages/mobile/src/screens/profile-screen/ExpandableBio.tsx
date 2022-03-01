import { useCallback, useEffect, useState } from 'react'

import { ProfileUser } from 'audius-client/src/common/store/pages/profile/types'
import {
  Pressable,
  View,
  Text,
  LayoutChangeEvent,
  LayoutAnimation
} from 'react-native'
import { useToggle } from 'react-use'

import { Hyperlink } from 'app/components/core'
import { makeStyles } from 'app/styles/makeStyles'

import { Sites } from './Sites'
import { squashNewLines } from './utils'

const messages = {
  showMore: 'show more',
  showLess: 'show less'
}

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
  root: {
    marginTop: spacing(3)
  },
  bio: {
    ...typography.body,
    color: palette.neutralLight2
  },
  expandButton: {
    marginTop: spacing(2)
  },
  expandText: {
    ...typography.h4,
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
  const hasSites = Boolean(website || donation)
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

  /*
   * hasSites isn't always correct on first render, this effect waits for
   * a potential change
   */
  useEffect(() => {
    if (hasSites) {
      setShouldShowMore(true)
    }
  }, [hasSites])

  if (!bio && !hasSites) return null

  return (
    <View style={styles.root}>
      <View>
        {bio ? (
          <Hyperlink source='profile page'>
            <Text
              numberOfLines={fullBioHeight && !isExpanded ? 2 : 0}
              style={styles.bio}
              onLayout={handleBioLayout}
            >
              {squashNewLines(bio)}
            </Text>
          </Hyperlink>
        ) : null}
        {hasSites && isExpanded ? <Sites profile={profile} /> : null}
      </View>
      {shouldShowMore ? (
        <Pressable style={styles.expandButton} onPress={handleToggleExpanded}>
          <Text style={styles.expandText}>
            {isExpanded ? messages.showLess : messages.showMore}
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
}
