import { forwardRef, useContext } from 'react'

import {
  Animated,
  SectionList as RNSectionList,
  SectionListProps as RNSectionListProps
} from 'react-native'
import { useCollapsibleScene } from 'react-native-collapsible-tab-view'

import { CollapsibleTabNavigatorContext } from '../top-tab-bar'

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

const CollapsibleSectionList = ({
  sceneName,
  ...other
}: CollapsibleSectionListProps) => {
  const scrollPropsAndRef = useCollapsibleSectionListScene(sceneName)
  return <Animated.SectionList {...other} {...scrollPropsAndRef} />
}

/**
 * Provides either a SectionList or an animated SectionList
 * depending on whether or not the list is found in a "collapsible" header tab
 */
export const SectionList = forwardRef<RNSectionList, SectionListProps>(
  (props: SectionListProps, ref) => {
    const { sceneName } = useContext(CollapsibleTabNavigatorContext)
    if (sceneName) {
      return <CollapsibleSectionList sceneName={sceneName} {...props} />
    }
    return <RNSectionList ref={ref} {...props} />
  }
)
