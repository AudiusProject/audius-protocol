import { CSSProperties } from 'react'

import {
  useGetTrackById,
  SquareSizes,
  statusIsNotFinalized,
  ID
} from '@audius/common'
import cn from 'classnames'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useTrackCoverArt2 } from 'hooks/useTrackCoverArt'

import styles from './DynamicTrackArtwork.module.css'

type DynamicTrackArtworkProps = {
  id: ID
  className?: string
  /** Size of artwork in _grid units_ */
  sizeUnits: number
}

/** Loads artwork for a given track ID and applies an optional className */
export const DynamicTrackArtwork = ({
  id,
  className,
  sizeUnits
}: DynamicTrackArtworkProps) => {
  const { status, data: track } = useGetTrackById({ id })
  const image = useTrackCoverArt2(id, SquareSizes.SIZE_150_BY_150)
  const loading = statusIsNotFinalized(status) || !track
  return loading ? null : (
    <DynamicImage
      wrapperClassName={cn(styles.container, className)}
      image={image}
      style={{ '--size-grid-units': sizeUnits } as CSSProperties}
    />
  )
}
