import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'

import { exploreMessages as messages } from '@audius/common/messages'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { ScrollView } from 'react-native'
import { ImageBackground, Keyboard } from 'react-native'
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
import { useDebounce } from 'react-use'

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

import { useSearchQuery } from '../../search-screen/searchState'

const AnimatedFlex = Animated.createAnimatedComponent(Flex)
const AnimatedText = Animated.createAnimatedComponent(Text)

// Animation parameters
const HEADER_SLIDE_HEIGHT = 46
const HEADER_COLLAPSE_THRESHOLD = 50

type SearchExploreHeaderProps = {
  filterTranslateY: SharedValue<number>
  scrollY: SharedValue<number>
  scrollRef: React.RefObject<ScrollView>
}

export const SearchExploreHeader = (props: SearchExploreHeaderProps) => {
  const { filterTranslateY, scrollY, scrollRef } = props
  const { spacing, color } = useTheme()
  const { params } = useRoute<'Search'>()
  const { drawerHelpers } = useContext(AppDrawerContext)
  const navigation = useNavigation()
  const textInputRef = useRef<any>(null)

  // Get state from context
  const [query, setQuery] = useSearchQuery()
  const [inputValue, setInputValue] = useState(query)
  useEffect(() => {
    setInputValue(query)
  }, [query])

  // Handle keyboard dismiss
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        if (params?.autoFocus === true) {
          // @ts-expect-error: setParams is not typed on the generic NavigationProp, but is available on StackNavigationProp
          navigation.setParams?.({ autoFocus: false })
        }
      }
    )

    return () => keyboardDidHideListener?.remove()
  }, [navigation, params?.autoFocus])

  // Focus the input when autoFocus is true and screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (params?.autoFocus === true && textInputRef.current) {
        const timer = setTimeout(() => {
          textInputRef.current?.focus()
        }, 100)

        return () => clearTimeout(timer)
      }
    }, [params?.autoFocus])
  )

  // State

  // Data fetching
  const animatedFilterPaddingVertical = useSharedValue(spacing.l)

  // Handlers
  const handleOpenLeftNavDrawer = useCallback(() => {
    drawerHelpers?.openDrawer()
  }, [drawerHelpers])

  const handleClearSearch = useCallback(() => {
    setInputValue('')
    scrollRef.current?.scrollTo({
      y: 0,
      animated: false
    })
  }, [setInputValue, scrollRef])

  const handleSearchInputChange = useCallback(
    (text: string) => {
      setInputValue(text)
      if (text === '') {
        scrollRef.current?.scrollTo?.({ y: 0, animated: false })
      }
    },
    [scrollRef]
  )

  // Immediate update for first character
  useEffect(() => {
    if (inputValue.length < 2) {
      setQuery(inputValue)
    }
  }, [inputValue, query, setQuery])

  // Normal debounced update for everything else
  useDebounce(
    () => {
      // Skip if we already handled the first character
      if (inputValue.length >= 2) {
        setQuery(inputValue)
      }
    },
    400,
    [inputValue]
  )

  // Animated styles

  // Header text fades out when collapsing
  // Height shrinks to collapse rows for avatar + input
  const headerTextAnimatedStyle = useAnimatedStyle(() => ({
    opacity: inputValue
      ? withTiming(0)
      : scrollY.value === 0
        ? withTiming(1)
        : interpolate(
            scrollY.value,
            [0, HEADER_COLLAPSE_THRESHOLD],
            [1, 0],
            Extrapolation.CLAMP
          ),
    transform: [
      {
        translateY: inputValue
          ? withTiming(-1)
          : scrollY.value === 0
            ? withTiming(0)
            : interpolate(
                scrollY.value,
                [HEADER_COLLAPSE_THRESHOLD, HEADER_COLLAPSE_THRESHOLD + 30],
                [0, -HEADER_SLIDE_HEIGHT],
                Extrapolation.CLAMP
              )
      }
    ],
    display: scrollY.value > HEADER_SLIDE_HEIGHT || inputValue ? 'none' : 'flex'
  }))

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: inputValue
          ? withTiming(0.83)
          : scrollY.value === 0
            ? withTiming(1)
            : interpolate(
                scrollY.value,
                [0, HEADER_COLLAPSE_THRESHOLD],
                [1, 0.83],
                Extrapolation.CLAMP
              )
      },
      {
        translateX: inputValue
          ? withTiming(30)
          : scrollY.value === 0
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
    marginTop: inputValue
      ? withTiming(-HEADER_SLIDE_HEIGHT)
      : scrollY.value === 0
        ? withTiming(0)
        : interpolate(
            scrollY.value,
            [0, HEADER_COLLAPSE_THRESHOLD],
            [0, -HEADER_SLIDE_HEIGHT],
            Extrapolation.CLAMP
          )
  }))

  // Avatar slides down in relation to colllapsing header
  // to stay in place visually
  const avatarSlideAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: inputValue
          ? withTiming(HEADER_SLIDE_HEIGHT)
          : scrollY.value === 0
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
    paddingVertical: inputValue
      ? withTiming(spacing.s)
      : scrollY.value === 0
        ? withTiming(spacing.l)
        : interpolate(
            scrollY.value,
            [0, HEADER_COLLAPSE_THRESHOLD],
            [spacing.l, spacing.s],
            Extrapolation.CLAMP
          ),
    gap: inputValue
      ? withTiming(0)
      : scrollY.value === 0
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
    marginTop:
      scrollY.value === 0 || inputValue
        ? withTiming(0)
        : filterTranslateY.value,
    backgroundColor:
      scrollY.value === 0
        ? withTiming('transparent')
        : interpolateColor(
            scrollY.value,
            [0, HEADER_COLLAPSE_THRESHOLD],
            [color.background.default, color.neutral.n25]
          ),
    borderColor:
      scrollY.value === 0
        ? withTiming('transparent')
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
              <Flex justifyContent='center'>
                <AnimatedText
                  variant='heading'
                  color='staticWhite'
                  style={headerTextAnimatedStyle}
                >
                  {messages.explore}
                </AnimatedText>
              </Flex>
            </Flex>
            <AnimatedText
              variant='title'
              color='staticWhite'
              style={headerTextAnimatedStyle}
            >
              {messages.description}
            </AnimatedText>
            <Animated.View style={inputAnimatedStyle}>
              <TextInput
                ref={textInputRef}
                label='Search'
                autoFocus={params?.autoFocus}
                autoCorrect={false}
                placeholder={messages.searchPlaceholder}
                size={TextInputSize.SMALL}
                startIcon={IconSearch}
                onChangeText={handleSearchInputChange}
                value={inputValue}
                endIcon={(props) =>
                  inputValue ? (
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
