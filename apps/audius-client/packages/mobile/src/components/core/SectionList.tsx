import type { MutableRefObject } from 'react'
import { forwardRef, useContext } from 'react'

import { Portal } from '@gorhom/portal'
import type {
  DefaultSectionT,
  SectionList as RNSectionList,
  SectionListProps as RNSectionListProps
} from 'react-native'
import { Animated, Platform, RefreshControl, View } from 'react-native'
import { useCollapsibleScene } from 'react-native-collapsible-tab-view'

import { useThemeColors } from 'app/utils/theme'

import { CollapsibleTabNavigatorContext } from '../top-tab-bar'

import { PlayBarChin } from './PlayBarChin'
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
  const {
    refreshing,
    onRefresh,
    scrollY: collapsibleScrollAnim
  } = useContext(CollapsibleTabNavigatorContext)

  const scrollPropsAndRef = useCollapsibleSectionListScene(sceneName)
  const { neutral, staticWhite } = useThemeColors()

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
      <Animated.SectionList
        {...other}
        {...scrollPropsAndRef}
        // @ts-ignore `forkEvent` is not defined on the type but it exists
        onScroll={Animated.forkEvent(
          scrollPropsAndRef.onScroll,
          props.onScroll
        )}
        refreshControl={
          Platform.OS === 'ios' ? undefined : (
            <RefreshControl
              progressViewOffset={scrollPropsAndRef.progressViewOffset}
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

const AnimatedSectionList = forwardRef<RNSectionList, SectionListProps>(
  function AnimatedSectionList(
    props,
    ref: MutableRefObject<RNSectionList<any, DefaultSectionT> | null>
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
          refreshControl={
            Platform.OS === 'ios' ? undefined : (
              <RefreshControl
                refreshing={!!isRefreshing}
                onRefresh={onRefresh ?? undefined}
                colors={[neutral]}
              />
            )
          }
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

    const flatListProps = {
      ...other,
      ListFooterComponent: FooterComponent
    }

    if (sceneName) {
      return <CollapsibleSectionList sceneName={sceneName} {...flatListProps} />
    }
    return <AnimatedSectionList ref={ref} {...flatListProps} />
  }
)
