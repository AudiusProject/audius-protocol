import { useLinkUnfurlMetadata } from '@audius/common'

import styles from './LinkPreview.module.css'

type LinkPreviewProps = {
  href: string
  chatId: string
  messageId: string
}
export const LinkPreview = (props: LinkPreviewProps) => {
  const { href, chatId, messageId } = props
  const metadata = useLinkUnfurlMetadata(chatId, messageId, href)
  const domain = metadata?.url ? new URL(metadata?.url).hostname : ''

  if (!metadata) {
    return null
  }

  return (
    <a
      className={styles.root}
      href={href}
      title={
        metadata.title ||
        metadata.site_name ||
        metadata.description ||
        'View Image'
      }
      target={'_blank'}
      rel='noreferrer'
    >
      {metadata.description || metadata.title ? (
        <>
          {metadata.image ? (
            <span className={styles.thumbnail}>
              <img src={metadata.image} alt={metadata.site_name} />
            </span>
          ) : null}
          <span className={styles.domain}>{domain}</span>
          <span className={styles.text}>
            {metadata.title ? (
              <span className={styles.title}>{metadata.title}</span>
            ) : null}
            {metadata.description ? (
              <span className={styles.description}>{metadata.description}</span>
            ) : null}
          </span>
        </>
      ) : metadata.image ? (
        <span>
          <img
            className={styles.image}
            src={metadata.image}
            alt={metadata.site_name}
          />
        </span>
      ) : null}
    </a>
  )
}
