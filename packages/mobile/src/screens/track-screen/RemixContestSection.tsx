import React, { useEffect, useMemo, useState } from 'react'

import { useRemixContest, useTrack, useCurrentUserId } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { TabView, SceneMap, TabBar } from 'react-native-tab-view'
import { usePrevious } from 'react-use'

import { Paper } from '@audius/harmony-native'
import { TabBody } from 'app/components/core/TabBody'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { RemixContestDetailsTab } from './RemixContestDetailsTab'
import { RemixContestPrizesTab } from './RemixContestPrizesTab'
import { RemixContestSubmissionsTab } from './RemixContestSubmissionsTab'
import { UploadRemixFooter } from './UploadRemixFooter'

const TAB_HEADER_HEIGHT = 48
const TAB_FOOTER_HEIGHT = 64

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
  tabBar: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight8,
    height: spacing(10)
  },
  tabLabel: {
    textTransform: 'none',
    fontFamily: typography.fontByWeight.demiBold,
    fontSize: typography.fontSize.medium
  },
  tabIndicator: {
    backgroundColor: palette.secondary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: 3,
    bottom: -3
  }
}))

export type RemixContestTabParamList = {
  Details: { trackId: ID }
  Prizes: { trackId: ID }
  Submissions: { trackId: ID }
}

type RemixContestSectionProps = {
  trackId: ID
}

type Route = {
  key: string
  title: string
}

const AnimatedPaper = Animated.createAnimatedComponent(Paper)

/**
 * Section displaying remix contest information for a track
 */
export const RemixContestSection = ({ trackId }: RemixContestSectionProps) => {
  const { data: remixContest } = useRemixContest(trackId)
  const { textIconSubdued, neutral } = useThemeColors()
  const styles = useStyles()

  const { data: track } = useTrack(trackId)
  const { data: currentUserId } = useCurrentUserId()
  const isOwner = track?.owner_id === currentUserId

  const [index, setIndex] = useState(0)
  const [routes] = useState<Route[]>([
    { key: 'details', title: 'Details' },
    { key: 'prizes', title: 'Prizes' },
    { key: 'submissions', title: 'Submissions' }
  ])
  const [heights, setHeights] = useState({})
  const [firstRender, setFirstRender] = useState(true)
  const animatedHeight = useSharedValue(TAB_HEADER_HEIGHT)
  const currentHeight = heights[routes[index].key]
  const previousHeight = usePrevious(currentHeight)
  const hasHeightChanged = currentHeight !== previousHeight

  useEffect(() => {
    if (firstRender) {
      setFirstRender(false)
    }
  }, [firstRender])

  const handleLayout = (key: string) => (e: any) => {
    const height = e.nativeEvent.layout.height
    setHeights((prev) => {
      if (prev[key] !== height) {
        return { ...prev, [key]: height }
      }
      return prev
    })
  }

  useEffect(() => {
    if (hasHeightChanged) {
      animatedHeight.value = withTiming(
        currentHeight + TAB_HEADER_HEIGHT + (isOwner ? 0 : TAB_FOOTER_HEIGHT),
        {
          duration: 250
        }
      )
    }
  }, [index, hasHeightChanged, currentHeight, animatedHeight, isOwner])

  const animatedStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value
  }))

  const renderScene = useMemo(
    () =>
      SceneMap({
        details: () => (
          <TabBody
            onLayout={handleLayout('details')}
            isVisible={index === 0 && !firstRender}
          >
            <RemixContestDetailsTab key='details' trackId={trackId} />
          </TabBody>
        ),
        prizes: () => (
          <TabBody
            onLayout={handleLayout('prizes')}
            isVisible={index === 1 && !firstRender}
          >
            <RemixContestPrizesTab key='prizes' trackId={trackId} />
          </TabBody>
        ),
        submissions: () => (
          <TabBody
            onLayout={handleLayout('submissions')}
            isVisible={index === 2 && !firstRender}
          >
            <RemixContestSubmissionsTab key='submissions' trackId={trackId} />
          </TabBody>
        )
      }),
    // Don't want handleLayout to re-trigger on index changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      style={styles.tabBar}
      labelStyle={styles.tabLabel}
      indicatorStyle={styles.tabIndicator}
      activeColor={neutral}
      inactiveColor={textIconSubdued}
      pressColor='transparent'
      pressOpacity={0.7}
    />
  )

  if (!remixContest) return null

  return (
    <AnimatedPaper backgroundColor='white' style={animatedStyle}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
      />
      {!isOwner && <UploadRemixFooter trackId={trackId} />}
    </AnimatedPaper>
  )
}
