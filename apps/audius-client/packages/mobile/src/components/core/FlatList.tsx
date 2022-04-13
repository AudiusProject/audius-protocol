import { forwardRef, MutableRefObject, useContext, useRef } from 'react'

import {
  Animated,
  FlatList as RNFlatList,
  FlatListProps as RNFlatListProps,
  View
} from 'react-native'
import { useCollapsibleScene } from 'react-native-collapsible-tab-view'

import { CollapsibleTabNavigatorContext } from '../top-tab-bar'

import { PlayBarChin } from './PlayBarChin'
import { PullToRefresh, useOverflowHandlers } from './PullToRefresh'

type FlatListProps = RNFlatListProps<any>

type CollapsibleFlatListProps = {
  sceneName: string
} & RNFlatListProps<any>

const CollapsibleFlatList = (props: CollapsibleFlatListProps) => {
  const { sceneName, ...other } = props
  const { onRefresh } = other
  const scrollPropsAndRef = useCollapsibleScene(sceneName)
  return (
    <View>
      {onRefresh ? <PullToRefresh /> : null}
      <Animated.FlatList
        {...other}
        {...scrollPropsAndRef}
        // @ts-ignore `forkEvent` is not defined on the type but it exists
        onScroll={Animated.forkEvent(
          scrollPropsAndRef.onScroll,
          props.onScroll
        )}
      />
    </View>
  )
}

const AnimatedFlatList = forwardRef<RNFlatList, FlatListProps>(
  function AnimatedFlatList(
    { refreshing, onRefresh, onScroll, ...other },
    ref: MutableRefObject<RNFlatList<any> | null>
  ) {
    const scrollRef = useRef<Animated.FlatList>(null)

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
      scrollResponder: ref?.current || scrollRef.current,
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
        <Animated.FlatList
          {...other}
          scrollToOverflowEnabled
          ref={ref || scrollRef}
          onScroll={handleScroll}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
        />
      </View>
    )
  }
)

/**
 * Provides either a FlatList or an animated FlatList
 * depending on whether or not the list is found in a "collapsible" header tab
 */
export const FlatList = forwardRef<RNFlatList, FlatListProps>(function FlatList(
  props: FlatListProps,
  ref
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

  const flatListProps = {
    ...other,
    ListFooterComponent: FooterComponent
  }

  if (sceneName) {
    return <CollapsibleFlatList sceneName={sceneName} {...flatListProps} />
  }
  return <AnimatedFlatList ref={ref} {...flatListProps} />
})
