import cn from 'classnames'

import PreviewTag from '../../assets/img/previewTag.svg'

import styles from './Preview.module.css'

export const Preview = ({ size }) => {
  return (
    <PreviewTag
      className={cn(styles.preview, { [styles.small]: size === 's' })}
    />
  )
}
