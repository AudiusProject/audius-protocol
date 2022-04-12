import { forwardRef, MutableRefObject, useContext } from 'react'

import { Portal } from '@gorhom/portal'
import {
  Animated,
  DefaultSectionT,
  SectionList as RNSectionList,
  SectionListProps as RNSectionListProps,
  View
} from 'react-native'
import { useCollapsibleScene } from 'react-native-collapsible-tab-view'

import { useThemeColors } from 'app/utils/theme'

import { CollapsibleTabNavigatorContext } from '../top-tab-bar'

import { PullToRefresh, useOverflowHandlers } from './PullToRefresh'

type SectionListProps = RNSectionListProps<any>

type CollapsibleSectionListProps = {
  sceneName: string
} & RNSectionListProps<any>

/**
 * Create a custom hook for the collapsible scene.
 * This is necessary because SectionLists by default do not have a
 * "scrollTo" built in, which breaks the collapsible tab library.
 * Inside this custom hook, we create a realRef method that pulls the
 * scroll responder out from inside the SectionList.
 */
const useCollapsibleSectionListScene = (sceneName: string) => {
  const scrollPropsAndRef = useCollapsibleScene(sceneName)
  const scrollableRef = (ref: RNSectionList) => {
    scrollPropsAndRef.ref(ref?.getScrollResponder())
  }
  return {
    ...scrollPropsAndRef,
    ref: scrollableRef
  }
}

const CollapsibleSectionList = (props: CollapsibleSectionListProps) => {
  const { sceneName, ...other } = props
  const { refreshing, onRefresh, scrollY: collapsibleScrollAnim } = useContext(
    CollapsibleTabNavigatorContext
  )

  const scrollPropsAndRef = useCollapsibleSectionListScene(sceneName)
  const { staticWhite } = useThemeColors()

  return (
    <View>
      {onRefresh ? (
        <Portal hostName='PullToRefreshPortalHost'>
          <PullToRefresh
            isRefreshing={refreshing}
            onRefresh={onRefresh}
            scrollAnim={collapsibleScrollAnim}
            topOffset={40}
            color={staticWhite}
          />
        </Portal>
      ) : null}
      <Animated.SectionList {...other} {...scrollPropsAndRef} />
    </View>
  )
}

const AnimatedSectionList = forwardRef<RNSectionList, SectionListProps>(
  function AnimatedSectionList(
    props,
    ref: MutableRefObject<RNSectionList<any, DefaultSectionT> | null>
  ) {
    const { refreshing, onRefresh, onScroll, ...other } = props
    const scrollResponder = ref.current?.getScrollResponder()
    const {
      isRefreshing,
      isRefreshDisabled,
      handleRefresh,
      scrollAnim,
      handleScroll,
      onScrollBeginDrag,
      onScrollEndDrag
    } = useOverflowHandlers({
      isRefreshing: refreshing,
      scrollResponder,
      onRefresh,
      onScroll
    })

    return (
      <View>
        {handleRefresh ? (
          <PullToRefresh
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            scrollAnim={scrollAnim}
            isRefreshDisabled={isRefreshDisabled}
          />
        ) : null}
        <Animated.SectionList
          {...other}
          scrollToOverflowEnabled
          ref={ref}
          onScroll={handleScroll}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
        />
      </View>
    )
  }
)

/**
 * Provides either a SectionList or a CollapsibleSectionList
 * depending on whether or not the list is found in a "collapsible" header tab
 */
export const SectionList = forwardRef<RNSectionList, SectionListProps>(
  function SectionList(props: SectionListProps, ref) {
    const { sceneName } = useContext(CollapsibleTabNavigatorContext)

    if (sceneName) {
      return <CollapsibleSectionList sceneName={sceneName} {...props} />
    }
    return <AnimatedSectionList ref={ref} {...props} />
  }
)
