import { ComponentProps, useEffect, useState } from 'react'

import { useTheme } from '@emotion/react'

import { Box, BoxProps, Flex } from 'components/layout'
import { Skeleton } from 'components/skeleton'

export type ArtworkProps = { isLoading?: boolean; borderWidth?: number } & Pick<
  ComponentProps<'img'>,
  'src'
> &
  BoxProps

/**
 * The artwork component displays the track cover art and appears in several
 * locations such as track tiles, track and playlist, pages,
 * and the sidebar. It can have interactive elements on hover.
 * This component enhances the listening experience and helps users quickly
 * identify their favorite tracks.
 */
export const Artwork = (props: ArtworkProps) => {
  const {
    isLoading: isLoadingProp,
    src,
    borderRadius = 's',
    borderWidth,
    shadow,
    children,
    ...other
  } = props
  const [isLoadingState, setIsLoadingState] = useState(!!src)
  const isLoading = isLoadingProp ?? isLoadingState
  const { color, motion } = useTheme()

  useEffect(() => {
    setIsLoadingState(!!src)
  }, [src])

  return (
    <Box {...other}>
      <Box
        borderRadius={borderRadius}
        border='default'
        shadow={shadow}
        css={{ borderWidth }}
      >
        {isLoading ? (
          <Skeleton
            borderRadius={borderRadius}
            h='100%'
            w='100%'
            css={{ zIndex: 1, position: 'absolute' }}
          />
        ) : null}
        <Box
          w='100%'
          pt='100%'
          borderRadius={borderRadius}
          css={{
            backgroundColor: src
              ? color.background.surface2
              : color.neutral.n400
          }}
        />
        {src ? (
          <Box
            as='img'
            borderRadius={borderRadius}
            h='100%'
            w='100%'
            onLoad={() => {
              setIsLoadingState(false)
            }}
            // @ts-ignore
            src={src}
            css={{
              position: 'absolute',
              top: 0,
              objectFit: 'cover',
              opacity: isLoading ? 0 : 1,
              transition: `opacity ${motion.calm}`
            }}
          />
        ) : null}
        {children ? (
          <Flex
            alignItems='center'
            justifyContent='center'
            h='100%'
            w='100%'
            borderRadius={borderRadius}
            css={{
              position: 'absolute',
              top: 0,
              backgroundColor: src ? color.static.black : undefined,
              opacity: src ? 0.4 : undefined
            }}
          >
            {children}
          </Flex>
        ) : null}
      </Box>
    </Box>
  )
}
