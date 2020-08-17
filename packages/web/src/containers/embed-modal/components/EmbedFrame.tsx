import React from 'react'

import styles from './EmbedFrame.module.css'

type EmbedFrameProps = {
  frameString: string
}

const EmbedFrame = ({ frameString }: EmbedFrameProps) => {
  if (!frameString) return null
  return (
    <div
      className={styles.frame}
      dangerouslySetInnerHTML={{ __html: frameString }}
    />
  )
}

export default EmbedFrame
