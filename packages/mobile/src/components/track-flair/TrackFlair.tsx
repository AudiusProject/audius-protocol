import type { ReactNode } from 'react'

import { useRemixContest, useTrack } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'

import { IconCosign, IconContestSign, useTheme } from '@audius/harmony-native'
import { makeStyles } from 'app/styles'

import { Size } from './types'

type CoSignProps = {
  size: Size
  children: ReactNode
  style?: StyleProp<ViewStyle>
  trackId: ID
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  check: {
    position: 'absolute',
    backgroundColor: palette.white
  }
}))

const layoutBySize = {
  [Size.TINY]: {
    position: {
      bottom: 2,
      right: -2
    },
    size: {
      height: 10,
      width: 10
    }
  },
  [Size.SMALL]: {
    position: {
      bottom: -4,
      right: -5
    },
    size: {
      height: 16,
      width: 16
    }
  },
  [Size.MEDIUM]: {
    position: {
      bottom: -3,
      right: -3
    },
    size: {
      height: 24,
      width: 24
    }
  },
  [Size.LARGE]: {
    position: {
      bottom: -8,
      right: -8
    },
    size: {
      height: 32,
      width: 32
    }
  },
  [Size.XLARGE]: {
    position: {
      bottom: -7,
      right: -7
    },
    size: {
      height: 44,
      width: 44
    }
  }
}

export const TrackFlair = ({ size, children, style, trackId }: CoSignProps) => {
  const styles = useStyles()
  const { color } = useTheme()
  const { data: track } = useTrack(trackId)
  const { data: remixContest } = useRemixContest(trackId)

  const { size: iconSize, position } = layoutBySize[size]

  if (!track) return children

  const remixTrack = track.remix_of?.tracks[0]
  const hasRemixAuthorReposted = remixTrack?.has_remix_author_reposted ?? false
  const hasRemixAuthorSaved = remixTrack?.has_remix_author_saved ?? false

  const isCosign = hasRemixAuthorReposted || hasRemixAuthorSaved

  const flair = isCosign ? (
    <IconCosign {...iconSize} fill={color.primary.p300} />
  ) : remixContest?.endDate ? (
    <IconContestSign {...iconSize} fill={color.primary.p300} />
  ) : null

  return (
    <>
      <View>{children}</View>
      <View style={[styles.check, position]}>{flair}</View>
    </>
  )
}
