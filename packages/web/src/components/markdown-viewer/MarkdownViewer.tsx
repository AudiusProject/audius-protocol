import cn from 'classnames'
import Markdown from 'markdown-to-jsx'

import styles from './MarkdownViewer.module.css'

export type MarkdownViewerProps = {
  markdown: string
  maxHeight?: number
  className?: string
}

const overrides = {
  a: ({ ...props }) => <a {...props} target='_blank' />
}

export const MarkdownViewer = ({
  markdown,
  maxHeight,
  className
}: MarkdownViewerProps) => {
  const style = {
    maxHeight
  }

  return (
    <div className={cn(styles.root, className)} style={style}>
      <Markdown options={{ overrides }}>{markdown}</Markdown>
    </div>
  )
}
