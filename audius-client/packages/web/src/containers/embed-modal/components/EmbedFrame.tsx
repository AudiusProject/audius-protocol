import React from 'react'

import styles from './EmbedFrame.module.css'

type EmbedFrameProps = {
  frameString: string
  // Optional container width if provided
  width?: number
}

const EmbedFrame = ({ frameString, width }: EmbedFrameProps) => {
  if (!frameString) return null
  const frame = (
    <div
      className={styles.frame}
      dangerouslySetInnerHTML={{ __html: frameString }}
    />
  )
  return width ? (
    <div className={styles.wrapper} style={{ width: `${width}px` }}>
      {frame}
    </div>
  ) : (
    frame
  )
}

export default EmbedFrame
