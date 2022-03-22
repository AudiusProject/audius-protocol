import { forwardRef, useContext } from 'react'

import {
  Animated,
  FlatList as RNFlatList,
  FlatListProps as RNFlatListProps
} from 'react-native'
import { useCollapsibleScene } from 'react-native-collapsible-tab-view'

import { CollapsibleTabNavigatorContext } from '../top-tab-bar'

type FlatListProps = RNFlatListProps<any>

type CollapsibleFlatListProps = {
  sceneName: string
} & RNFlatListProps<any>

const CollapsibleFlatList = ({
  sceneName,
  ...other
}: CollapsibleFlatListProps) => {
  const scrollPropsAndRef = useCollapsibleScene(sceneName)
  return <Animated.FlatList {...other} {...scrollPropsAndRef} />
}

/**
 * Provides either a FlatList or an animated FlatList
 * depending on whether or not the list is found in a "collapsible" header tab
 */
export const FlatList = forwardRef<RNFlatList, FlatListProps>(
  (props: FlatListProps, ref) => {
    const { sceneName } = useContext(CollapsibleTabNavigatorContext)
    if (sceneName) {
      return <CollapsibleFlatList sceneName={sceneName} {...props} />
    }
    return <RNFlatList ref={ref} {...props} />
  }
)
