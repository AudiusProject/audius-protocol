import { memo } from 'react'

import { Nullable } from '@audius/common/utils'
import cn from 'classnames'
import { FileWithPreview } from 'react-dropzone'

import styles from './CoverPhoto.module.css'

type CoverPhotoProps = {
  userId: Nullable<number>
  updatedCoverPhoto?: string
  className?: string
  loading?: boolean
  error?: boolean
  edit?: boolean
  darken?: boolean
  onDrop?: (
    file: FileWithPreview[],
    source: 'original' | 'unsplash' | 'url'
  ) => Promise<void>
}

const ServerCoverPhoto = ({ className }: CoverPhotoProps) => {
  return (
    <div className={cn(styles.coverPhoto, className)}>
      {/* TODO: Add static image here */}
    </div>
  )
}

export default memo(ServerCoverPhoto)
