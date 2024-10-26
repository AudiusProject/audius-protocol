import { ComponentProps, useEffect, useRef, useState } from 'react'

import { useTheme } from '@emotion/react'

import { Box, BoxProps } from '../layout/Box'
import { Flex } from '../layout/Flex'
import { Skeleton } from '../skeleton'

export type ArtworkProps = {
  isLoading?: boolean
  borderWidth?: number
  'data-testid'?: string
  noLoading?: boolean
} & Pick<ComponentProps<'img'>, 'src'> &
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
    'data-testid': testId,
    ...other
  } = props
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [isLoadingState, setIsLoadingState] = useState(true)
  const isLoading = isLoadingProp ?? isLoadingState
  const { color, motion } = useTheme()

  useEffect(() => {
    setIsLoadingState(true)
  }, [src])

  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoadingState(false)
    }
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
            css={{ zIndex: 2, position: 'absolute' }}
          />
        ) : null}
        <Box
          w='100%'
          pt='100%'
          borderRadius={borderRadius}
          css={{
            backgroundColor:
              !src && children ? color.neutral.n400 : color.background.surface2
          }}
        />
        {src ? (
          <Box
            as='img'
            ref={imgRef}
            borderRadius={borderRadius}
            h='100%'
            w='100%'
            onLoad={() => {
              setIsLoadingState(false)
            }}
            // @ts-ignore
            src={src}
            data-testid={testId}
            draggable={false}
            css={{
              position: 'absolute',
              top: 0,
              left: 0,
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
              left: 0,
              backgroundColor: src ? color.static.black : undefined,
              opacity: src ? 0.4 : undefined,
              zIndex: 1
            }}
          >
            {children}
          </Flex>
        ) : null}
      </Box>
    </Box>
  )
}
