import { useLinkUnfurlMetadata } from '@audius/common'
import cn from 'classnames'

import styles from './LinkPreview.module.css'

type LinkPreviewProps = {
  href: string
  chatId: string
  messageId: string
  className?: string
}
export const LinkPreview = (props: LinkPreviewProps) => {
  const { href, chatId, messageId } = props
  const metadata = useLinkUnfurlMetadata(chatId, messageId, href) ?? {}
  const domain = metadata?.url ? new URL(metadata?.url).hostname : ''
  const { description, title, image, site_name: siteName } = metadata
  const hasMetadata = !!(description || title || image)

  if (!hasMetadata) {
    return null
  }

  return (
    <a
      className={cn(styles.root, props.className)}
      href={href}
      title={title || siteName || description || 'View Image'}
      target={'_blank'}
      rel='noreferrer'
    >
      {description || title ? (
        <>
          {image ? (
            <span className={styles.thumbnail}>
              <img src={image} alt={siteName} />
            </span>
          ) : null}
          <span className={styles.domain}>{domain}</span>
          <span className={styles.text}>
            {title ? <span className={styles.title}>{title}</span> : null}
            {description ? (
              <span className={styles.description}>{description}</span>
            ) : null}
          </span>
        </>
      ) : image ? (
        <span>
          <img className={styles.image} src={image} alt={siteName} />
        </span>
      ) : null}
    </a>
  )
}
