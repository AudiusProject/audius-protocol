import { useEffect, useState } from 'react'

import { useTheme } from '@emotion/react'
import MaskedView from '@react-native-masked-view/masked-view'
import FastImage from 'react-native-fast-image'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import Svg, { Path, G } from 'react-native-svg'

import type { FastImageProps } from './FastImage/FastImage'
import { Skeleton } from './Skeleton'
import { Box } from './layout/Box/Box'
import type { BoxProps } from './layout/Box/types'
import { Flex } from './layout/Flex/Flex'

const AnimatedFastImage = Animated.createAnimatedComponent(FastImage)

const HEXAGON_BORDER_INSET_SCALE = 0.99

export type ArtworkProps = {
  isLoading?: boolean
  borderWidth?: number
  'data-testid'?: string
  noLoading?: boolean
  hex?: boolean
} & Partial<Pick<FastImageProps, 'source' | 'priority'>> &
  BoxProps

/**
 * The artwork component displays entity content and appears in several
 * locations such as track tiles, track and playlist, pages,
 * and the sidebar. It can have interactive elements on hover.
 * This component enhances the listening experience and helps users quickly
 * identify their favorite tracks.
 */
export const Artwork = (props: ArtworkProps) => {
  const {
    isLoading: isLoadingProp,
    source,
    borderRadius = 's',
    borderWidth,
    shadow,
    children,
    'data-testid': testId,
    priority,
    hex = false,
    ...other
  } = props
  const [isLoadingState, setIsLoadingState] = useState(true)
  const isLoading = isLoadingProp ?? isLoadingState
  const { color, cornerRadius, motion } = useTheme()

  const imageSource = !source
    ? source
    : typeof source === 'number'
      ? source
      : Array.isArray(source)
        ? { uri: source[0].uri, priority }
        : { uri: source.uri, priority }

  const hasImageSource = typeof imageSource === 'number' || imageSource?.uri

  // Create shared value for opacity
  const opacity = useSharedValue(0)

  // Create animated style
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }))

  // Animate opacity when loading state changes
  useEffect(() => {
    if (!isLoading) {
      opacity.value = withTiming(1, motion.expressive)
    } else {
      opacity.value = 0
    }
  }, [isLoading, opacity, motion.expressive])

  useEffect(() => {
    setIsLoadingState(true)
  }, [source])

  // Hexagonal mask component for hex mode
  const HexagonalMask = ({ size }: { size: number }) => (
    <Svg width={size} height={size} viewBox='0 0 1 1'>
      <Path
        d='M0.966 0.378C0.93 0.301 0.887 0.228 0.839 0.158L0.824 0.136C0.805 0.108 0.779 0.085 0.75 0.068C0.721 0.051 0.688 0.041 0.655 0.039L0.627 0.036C0.543 0.03 0.457 0.03 0.373 0.036L0.346 0.039C0.312 0.041 0.279 0.051 0.25 0.068C0.221 0.085 0.196 0.108 0.177 0.136L0.161 0.158C0.113 0.228 0.07 0.302 0.034 0.378L0.022 0.403C0.008 0.433 0 0.466 0 0.5C0 0.534 0.008 0.567 0.022 0.597L0.034 0.622C0.07 0.698 0.113 0.772 0.161 0.842L0.177 0.864C0.196 0.892 0.221 0.915 0.25 0.932C0.279 0.949 0.312 0.959 0.346 0.961L0.373 0.964C0.457 0.97 0.543 0.97 0.627 0.964L0.655 0.961C0.688 0.959 0.721 0.949 0.75 0.932C0.779 0.915 0.805 0.892 0.824 0.864L0.839 0.842C0.887 0.772 0.93 0.698 0.966 0.622L0.978 0.597C0.992 0.567 1 0.534 1 0.5C1 0.466 0.992 0.433 0.978 0.403L0.966 0.378Z'
        fill='white'
      />
    </Svg>
  )

  // Hexagonal border component for hex mode
  const HexagonalBorder = ({ size }: { size: number }) => {
    const centerOffset = (1 - HEXAGON_BORDER_INSET_SCALE) / 2

    return (
      <Svg
        width={size}
        height={size}
        viewBox='0 0 1 1'
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <G
          transform={`translate(${centerOffset}, ${centerOffset}) scale(${HEXAGON_BORDER_INSET_SCALE})`}
        >
          <Path
            d='M0.966 0.378C0.93 0.301 0.887 0.228 0.839 0.158L0.824 0.136C0.805 0.108 0.779 0.085 0.75 0.068C0.721 0.051 0.688 0.041 0.655 0.039L0.627 0.036C0.543 0.03 0.457 0.03 0.373 0.036L0.346 0.039C0.312 0.041 0.279 0.051 0.25 0.068C0.221 0.085 0.196 0.108 0.177 0.136L0.161 0.158C0.113 0.228 0.07 0.302 0.034 0.378L0.022 0.403C0.008 0.433 0 0.466 0 0.5C0 0.534 0.008 0.567 0.022 0.597L0.034 0.622C0.07 0.698 0.113 0.772 0.161 0.842L0.177 0.864C0.196 0.892 0.221 0.915 0.25 0.932C0.279 0.949 0.312 0.959 0.346 0.961L0.373 0.964C0.457 0.97 0.543 0.97 0.627 0.964L0.655 0.961C0.688 0.959 0.721 0.949 0.75 0.932C0.779 0.915 0.805 0.892 0.824 0.864L0.839 0.842C0.887 0.772 0.93 0.698 0.966 0.622L0.978 0.597C0.992 0.567 1 0.534 1 0.5C1 0.466 0.992 0.433 0.978 0.403L0.966 0.378Z'
            fill='none'
            stroke={color.neutral.n950}
            opacity={0.3}
            strokeWidth={1 / size}
          />
        </G>
      </Svg>
    )
  }

  const artworkContent = (
    <Box {...other}>
      <Box
        borderRadius={hex ? undefined : borderRadius}
        border={hex ? undefined : 'default'}
        shadow={shadow}
        style={{ borderWidth: hex ? undefined : borderWidth }}
      >
        {isLoading ? (
          <Skeleton
            borderRadius={hex ? undefined : borderRadius}
            h='100%'
            w='100%'
            style={{
              zIndex: 2,
              position: 'absolute',
              opacity: isLoading ? 1 : 0
            }}
          />
        ) : null}
        <Box
          w='100%'
          pt='100%'
          borderRadius={hex ? undefined : borderRadius}
          style={{
            backgroundColor:
              !hasImageSource && children
                ? color.neutral.n400
                : color.background.surface2
          }}
        />
        {hasImageSource ? (
          <AnimatedFastImage
            source={imageSource}
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: hex ? 0 : cornerRadius[borderRadius]
              },
              animatedStyle
            ]}
            onLoad={() => {
              setIsLoadingState(false)
            }}
            onError={() => {
              setIsLoadingState(false)
            }}
            testID={testId}
          />
        ) : null}
        {children ? (
          <Flex
            h='100%'
            w='100%'
            alignItems='center'
            justifyContent='center'
            style={{
              position: 'absolute',
              top: 0,
              left: 0
            }}
          >
            {children}
          </Flex>
        ) : null}
      </Box>
    </Box>
  )

  // If not hexagonal, return the artwork as-is
  if (!hex) {
    return artworkContent
  }

  // For hexagonal artwork, wrap with mask and border
  return (
    <Box {...other} style={{ position: 'relative' }}>
      <MaskedView
        maskElement={<HexagonalMask size={100} />}
        style={{ flex: 1 }}
      >
        <Box
          borderRadius={borderRadius}
          border='default'
          shadow={shadow}
          style={{ borderWidth }}
        >
          {isLoading ? (
            <Skeleton
              borderRadius={borderRadius}
              h='100%'
              w='100%'
              style={{
                zIndex: 2,
                position: 'absolute',
                opacity: isLoading ? 1 : 0
              }}
            />
          ) : null}
          <Box
            w='100%'
            pt='100%'
            borderRadius={borderRadius}
            style={{
              backgroundColor:
                !hasImageSource && children
                  ? color.neutral.n400
                  : color.background.surface2
            }}
          />
          {hasImageSource ? (
            <AnimatedFastImage
              source={imageSource}
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: cornerRadius[borderRadius]
                },
                animatedStyle
              ]}
              onLoad={() => {
                setIsLoadingState(false)
              }}
              onError={() => {
                setIsLoadingState(false)
              }}
              testID={testId}
            />
          ) : null}
          {children ? (
            <Flex
              h='100%'
              w='100%'
              alignItems='center'
              justifyContent='center'
              style={{
                position: 'absolute',
                top: 0,
                left: 0
              }}
            >
              {children}
            </Flex>
          ) : null}
        </Box>
      </MaskedView>
      <HexagonalBorder size={100} />
    </Box>
  )
}
