import { useCallback, useContext, useState } from 'react'

import { exploreMessages as messages } from '@audius/common/messages'
import { ImageBackground } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'
import Animated, {
  useSharedValue,
  interpolate,
  useAnimatedStyle,
  interpolateColor,
  Extrapolation,
  withTiming,
  useDerivedValue
} from 'react-native-reanimated'

import {
  Flex,
  IconButton,
  IconCloseAlt,
  IconSearch,
  Text,
  TextInput,
  TextInputSize,
  useTheme
} from '@audius/harmony-native'
import imageSearchHeaderBackground from 'app/assets/images/imageSearchHeaderBackground2x.png'
import { useRoute } from 'app/hooks/useRoute'
import { AppDrawerContext } from 'app/screens/app-drawer-screen'
import { AccountPictureHeader } from 'app/screens/app-screen/AccountPictureHeader'
import { SearchCategoriesAndFilters } from 'app/screens/search-screen/SearchCategoriesAndFilters'

const AnimatedFlex = Animated.createAnimatedComponent(Flex)
const AnimatedText = Animated.createAnimatedComponent(Text)

// Animation parameters
const HEADER_SLIDE_HEIGHT = 46
const HEADER_COLLAPSE_THRESHOLD = 50

type SearchExploreHeaderProps = {
  filterTranslateY: SharedValue<number>
  scrollY: SharedValue<number>
  searchInput: string
  handleClearSearch: () => void
  handleSearchInputChange: (text: string) => void
}
export const SearchExploreHeader = (props: SearchExploreHeaderProps) => {
  const {
    filterTranslateY,
    scrollY,
    searchInput,
    handleClearSearch,
    handleSearchInputChange
  } = props
  const { spacing, color } = useTheme()
  const { params } = useRoute<'Search'>()
  const { drawerHelpers } = useContext(AppDrawerContext)

  // State
  const [autoFocus] = useState(params?.autoFocus ?? false)
  // Data fetching
  const animatedFilterPaddingVertical = useSharedValue(spacing.l)

  // Derived data

  // Handlers
  const handleOpenLeftNavDrawer = useCallback(() => {
    drawerHelpers?.openDrawer()
  }, [drawerHelpers])

  // Animated styles

  // Header text fades out when collapsing
  // Height shrinks to collapse rows for avatar + input
  const headerTextAnimatedStyle = useAnimatedStyle(() => ({
    opacity:
      scrollY.value === 0
        ? withTiming(1)
        : interpolate(
            scrollY.value,
            [0, HEADER_COLLAPSE_THRESHOLD],
            [1, 0],
            Extrapolation.CLAMP
          ),
    height:
      scrollY.value === 0
        ? withTiming(48)
        : interpolate(
            scrollY.value,
            [HEADER_COLLAPSE_THRESHOLD, HEADER_COLLAPSE_THRESHOLD + 30],
            [48, 0],
            Extrapolation.CLAMP
          )
  }))

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale:
          scrollY.value === 0
            ? withTiming(1)
            : interpolate(
                scrollY.value,
                [0, HEADER_COLLAPSE_THRESHOLD],
                [1, 0.83],
                Extrapolation.CLAMP
              )
      },
      {
        translateX:
          scrollY.value === 0
            ? withTiming(0)
            : interpolate(
                scrollY.value,
                [0, HEADER_COLLAPSE_THRESHOLD],
                [0, 30],
                Extrapolation.CLAMP
              )
      }
    ]
  }))

  // Header slides up to collapse
  const headerSlideAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          scrollY.value === 0
            ? withTiming(0)
            : interpolate(
                scrollY.value,
                [0, HEADER_COLLAPSE_THRESHOLD],
                [0, -HEADER_SLIDE_HEIGHT],
                Extrapolation.CLAMP
              )
      }
    ]
  }))

  // Avatar slides down in relation to colllapsing header
  // to stay in place visually
  const avatarSlideAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          scrollY.value === 0
            ? withTiming(0)
            : interpolate(
                scrollY.value,
                [0, HEADER_COLLAPSE_THRESHOLD],
                [0, HEADER_SLIDE_HEIGHT],
                Extrapolation.CLAMP
              )
      }
    ]
  }))

  // Header padding and gap shrink when collapsing
  const headerPaddingShrinkStyle = useAnimatedStyle(() => ({
    paddingVertical:
      scrollY.value === 0
        ? withTiming(spacing.l)
        : interpolate(
            scrollY.value,
            [0, HEADER_COLLAPSE_THRESHOLD],
            [spacing.l, spacing.s],
            Extrapolation.CLAMP
          ),
    gap:
      scrollY.value === 0
        ? withTiming(spacing.l)
        : interpolate(
            scrollY.value,
            [0, HEADER_COLLAPSE_THRESHOLD],
            [spacing.l, 0],
            Extrapolation.CLAMP
          )
  }))

  // Filters slide up when header collapses
  // and hides when scrolling further down
  const filtersAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          scrollY.value === 0
            ? withTiming(0)
            : interpolate(
                scrollY.value,
                [0, HEADER_COLLAPSE_THRESHOLD],
                [0, -HEADER_SLIDE_HEIGHT],
                Extrapolation.CLAMP
              ) + filterTranslateY.value
      }
    ],
    backgroundColor:
      scrollY.value === 0
        ? withTiming(color.background.default)
        : interpolateColor(
            scrollY.value,
            [0, HEADER_COLLAPSE_THRESHOLD],
            [color.background.default, color.neutral.n25]
          ),
    borderColor:
      scrollY.value === 0
        ? withTiming(color.background.default)
        : interpolateColor(
            scrollY.value,
            [0, HEADER_COLLAPSE_THRESHOLD],
            [color.background.default, color.border.strong]
          )
  }))
  useDerivedValue(() => {
    animatedFilterPaddingVertical.value =
      scrollY.value === 0
        ? spacing.l
        : interpolate(
            scrollY.value,
            [0, HEADER_COLLAPSE_THRESHOLD],
            [spacing.l, spacing.m],
            Extrapolation.CLAMP
          )
  })

  return (
    <>
      <AnimatedFlex style={[{ zIndex: 2 }, headerSlideAnimatedStyle]}>
        <ImageBackground source={imageSearchHeaderBackground}>
          <AnimatedFlex pt='unit14' ph='l' style={headerPaddingShrinkStyle}>
            <Flex
              direction='row'
              gap='m'
              h={spacing.unit11}
              alignItems='center'
            >
              <AnimatedFlex
                style={[inputAnimatedStyle, avatarSlideAnimatedStyle]}
                w={spacing.unit10}
              >
                <AccountPictureHeader onPress={handleOpenLeftNavDrawer} />
              </AnimatedFlex>
              <AnimatedFlex
                style={[headerTextAnimatedStyle]}
                justifyContent='center'
              >
                <Text variant='heading' color='staticWhite'>
                  {messages.explore}
                </Text>
              </AnimatedFlex>
            </Flex>
            <AnimatedText
              variant='title'
              color='staticWhite'
              style={[headerTextAnimatedStyle]}
            >
              {messages.description}
            </AnimatedText>
            <Animated.View style={inputAnimatedStyle}>
              <TextInput
                label='Search'
                autoFocus={autoFocus}
                placeholder={messages.searchPlaceholder}
                size={TextInputSize.SMALL}
                startIcon={IconSearch}
                onChangeText={handleSearchInputChange}
                value={searchInput}
                endIcon={(props) =>
                  searchInput ? (
                    <IconButton
                      icon={IconCloseAlt}
                      color='subdued'
                      onPress={handleClearSearch}
                      hitSlop={10}
                      {...props}
                    />
                  ) : null
                }
              />
            </Animated.View>
          </AnimatedFlex>
        </ImageBackground>
      </AnimatedFlex>
      <AnimatedFlex
        style={[filtersAnimatedStyle, { zIndex: 1, borderBottomWidth: 1 }]}
      >
        <SearchCategoriesAndFilters
          animatedPaddingVertical={animatedFilterPaddingVertical}
        />
      </AnimatedFlex>
    </>
  )
}
