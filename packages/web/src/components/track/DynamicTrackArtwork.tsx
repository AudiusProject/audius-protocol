import { SquareSizes, statusIsNotFinalized, ID } from '@audius/common/models'
import {} from '@audius/common'
import { useGetTrackById } from '@audius/common/api'
import cn from 'classnames'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useTrackCoverArt2 } from 'hooks/useTrackCoverArt'

import styles from './DynamicTrackArtwork.module.css'

export enum DynamicTrackArtworkSize {
  /** 40x40 */
  SMALL = 'small',
  /** 64x64 */
  DEFAULT = 'default'
}

type DynamicTrackArtworkProps = {
  id: ID
  className?: string
  size?: DynamicTrackArtworkSize
}

/** Loads artwork for a given track ID and applies an optional className */
export const DynamicTrackArtwork = ({
  id,
  className,
  size = DynamicTrackArtworkSize.DEFAULT
}: DynamicTrackArtworkProps) => {
  const { status, data: track } = useGetTrackById({ id })
  const image = useTrackCoverArt2(id, SquareSizes.SIZE_150_BY_150)
  const loading = statusIsNotFinalized(status) || !track
  return loading ? null : (
    <DynamicImage
      wrapperClassName={cn(styles.container, styles[size], className)}
      image={image}
    />
  )
}
