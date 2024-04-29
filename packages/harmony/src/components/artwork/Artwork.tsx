import { ComponentProps, useState } from 'react'

import { useTheme } from '@emotion/react'

import { Box, BoxProps } from 'components/layout'
import { Skeleton } from 'components/skeleton'

export type ArtworkProps = { isLoading?: boolean } & Pick<
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
  const { isLoading: isLoadingProp, src, borderRadius = 's', ...other } = props
  const [isLoadingState, setIsLoading] = useState(isLoadingProp ?? true)
  const isLoading = isLoadingProp ?? isLoadingState
  const { motion } = useTheme()

  return (
    <Box {...other}>
      <Box borderRadius={borderRadius} border='default'>
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
          backgroundColor='surface2'
        />
        <Box
          as='img'
          borderRadius={borderRadius}
          h='100%'
          w='100%'
          onLoad={() => {
            setIsLoading(false)
          }}
          // @ts-ignore
          src={src}
          css={{
            position: 'absolute',
            top: 0,
            left: 0,
            objectFit: 'cover',
            opacity: isLoading ? 0 : 1,
            transition: `opacity ${motion.calm}`
          }}
        />
      </Box>
    </Box>
  )
}
