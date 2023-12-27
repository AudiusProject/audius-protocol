import type { MutableRefObject, Ref } from 'react'
import { forwardRef, useContext, useRef } from 'react'

import type {
  FlatListProps as RNFlatListProps,
  FlatList as RNFlatList
} from 'react-native'
import { Animated, Platform, RefreshControl, View } from 'react-native'
import { useCollapsibleScene } from 'react-native-collapsible-tab-view'

import { useThemeColors } from 'app/utils/theme'

import { CollapsibleTabNavigatorContext } from '../top-tab-bar'

import { PlayBarChin } from './PlayBarChin'
import { PullToRefresh, useOverflowHandlers } from './PullToRefresh'

export type FlatListT<ItemT> = RNFlatList<ItemT>
export type AnimatedFlatListT<ItemT> = Animated.FlatList<ItemT>

type CollapsibleFlatListProps<ItemT> = {
  sceneName: string
} & Animated.AnimatedProps<RNFlatListProps<ItemT>>

function CollapsibleFlatList<ItemT>(props: CollapsibleFlatListProps<ItemT>) {
  const { sceneName, onScroll, ...other } = props
  const { refreshing, onRefresh } = other
  const scrollPropsAndRef = useCollapsibleScene(sceneName)
  const { neutral } = useThemeColors()
  return (
    <View>
      {onRefresh ? <PullToRefresh /> : null}
      <Animated.FlatList
        {...other}
        {...scrollPropsAndRef}
        // @ts-ignore `forkEvent` is not defined on the type but it exists
        onScroll={Animated.forkEvent(scrollPropsAndRef.onScroll, onScroll)}
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

const AnimatedFlatList = forwardRef(function AnimatedFlatList<ItemT>(
  props: Animated.AnimatedProps<RNFlatListProps<ItemT>>,
  ref: MutableRefObject<Animated.FlatList<ItemT> | null>
) {
  const { refreshing, onRefresh, onScroll, ...other } = props
  const scrollRef = useRef<Animated.FlatList>(null)
  const { neutral } = useThemeColors()

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
    scrollResponder: ref?.current || scrollRef.current,
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
      <Animated.FlatList
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
        ref={ref || scrollRef}
        onScroll={handleScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
      />
    </View>
  )
})

export type FlatListProps<ItemT> = RNFlatListProps<ItemT> & {
  sceneName?: string
}

/**
 * Provides either a FlatList or an animated FlatList
 * depending on whether or not the list is found in a "collapsible" header tab
 */
export const FlatList = forwardRef(function FlatList<ItemT>(
  props: FlatListProps<ItemT>,
  ref: Ref<FlatListT<ItemT>>
) {
  const { ListFooterComponent, sceneName: sceneNameProp, ...other } = props
  const { sceneName: sceneNameContext } = useContext(
    CollapsibleTabNavigatorContext
  )
  const sceneName = sceneNameProp ?? sceneNameContext
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
    return (
      <CollapsibleFlatList
        sceneName={sceneName}
        {...(flatListProps as Animated.AnimatedProps<RNFlatListProps<ItemT>>)}
      />
    )
  }
  return (
    <AnimatedFlatList
      ref={ref as Ref<AnimatedFlatListT<ItemT>>}
      {...(flatListProps as Animated.AnimatedProps<RNFlatListProps<ItemT>>)}
    />
  )
})
