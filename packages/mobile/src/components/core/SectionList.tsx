import type { Ref, RefObject } from 'react'
import { forwardRef, useContext } from 'react'

import { Portal } from '@gorhom/portal'
import type {
  DefaultSectionT,
  SectionList as RNSectionList,
  SectionListProps as RNSectionListProps
} from 'react-native'
import { Animated, Platform, RefreshControl, View } from 'react-native'
import { Tabs, useCollapsibleStyle } from 'react-native-collapsible-tab-view'

import { useThemeColors } from 'app/utils/theme'

import { CollapsibleTabNavigatorContext } from '../top-tab-bar'

import { PlayBarChin } from './PlayBarChin'
import { PullToRefresh, useOverflowHandlers } from './PullToRefresh'

type CollapsibleSectionListProps<ItemT, SectionT = DefaultSectionT> = {
  sceneName: string
} & Animated.AnimatedProps<RNSectionListProps<ItemT, SectionT>>

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

const CollapsibleSectionList = <ItemT, SectionT = DefaultSectionT>(
  props: CollapsibleSectionListProps<ItemT, SectionT>
) => {
  const { sceneName, ...other } = props
  const {
    refreshing,
    onRefresh,
    scrollY: collapsibleScrollAnim
  } = useContext(CollapsibleTabNavigatorContext)

  const { neutral, staticWhite } = useThemeColors()
  const { progressViewOffset } = useCollapsibleStyle()

  return (
    <View>
      {Platform.OS === 'ios' && onRefresh ? (
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
      <Tabs.SectionList
        {...other}
        refreshControl={
          Platform.OS === 'ios' ? undefined : (
            <RefreshControl
              progressViewOffset={progressViewOffset}
              refreshing={!!refreshing}
              onRefresh={onRefresh ?? undefined}
              colors={[neutral]}
            />
          )
        }
      />
    </View>
  )
}

const AnimatedSectionList = forwardRef(function AnimatedSectionList<
  ItemT,
  SectionT = DefaultSectionT
>(
  props: Animated.AnimatedProps<RNSectionListProps<ItemT, SectionT>>,
  ref: RefObject<RNSectionList<ItemT, SectionT>>
) {
  const { refreshing, onRefresh, onScroll, ...other } = props
  const { neutral } = useThemeColors()
  const scrollResponder = ref?.current?.getScrollResponder()
  const {
    isRefreshing,
    isRefreshDisabled,
    handleRefresh,
    scrollAnim,
    handleScroll,
    onScrollBeginDrag,
    onScrollEndDrag
  } = useOverflowHandlers({
    isRefreshing: Boolean(refreshing),
    scrollResponder,
    onRefresh,
    onScroll
  })

  return (
    <View>
      {Platform.OS === 'ios' && handleRefresh ? (
        <PullToRefresh
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          scrollAnim={scrollAnim}
          isRefreshDisabled={isRefreshDisabled}
          yOffsetDisappearance={-16}
        />
      ) : null}

      <Animated.SectionList
        {...other}
        scrollToOverflowEnabled
        refreshControl={
          Platform.OS === 'ios' ? undefined : (
            <RefreshControl
              refreshing={!!isRefreshing}
              onRefresh={onRefresh ?? undefined}
              colors={[neutral]}
            />
          )
        }
        // Have to cast here because Animated version doesn't type getScrollResponder
        ref={ref as Ref<Animated.SectionList<ItemT, SectionT>>}
        onScroll={handleScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
      />
    </View>
  )
})

export const SectionList = forwardRef(function SectionList<
  ItemT,
  SectionT = DefaultSectionT
>(
  props: Animated.AnimatedProps<RNSectionListProps<ItemT, SectionT>>,
  ref: Ref<RNSectionList<ItemT, SectionT>>
) {
  const { ListFooterComponent, ...other } = props
  const { sceneName } = useContext(CollapsibleTabNavigatorContext)

  const FooterComponent = ListFooterComponent ? (
    <>
      {ListFooterComponent}
      <PlayBarChin />
    </>
  ) : (
    PlayBarChin
  )

  const sectionListProps = {
    ...other,
    ListFooterComponent: FooterComponent
  }

  if (sceneName) {
    return (
      <CollapsibleSectionList sceneName={sceneName} {...sectionListProps} />
    )
  }
  return <AnimatedSectionList ref={ref} {...sectionListProps} />
})
