import { MouseEventHandler, useCallback, useEffect } from 'react'

import { isAudiusUrl, useLeavingAudiusModal } from '@audius/common'
import { useLinkUnfurlMetadata } from '@audius/common/hooks'
import cn from 'classnames'

import styles from './LinkPreview.module.css'

type LinkPreviewProps = {
  href: string
  chatId: string
  messageId: string
  onEmpty?: () => void
  onSuccess?: () => void
  className?: string
}
export const LinkPreview = (props: LinkPreviewProps) => {
  const { href, chatId, messageId, onEmpty, onSuccess } = props
  const metadata = useLinkUnfurlMetadata(chatId, messageId, href) ?? {}
  const { description, title, site_name: siteName, image } = metadata
  const willRender = !!(description || title || image)
  const domain = metadata?.url ? new URL(metadata?.url).hostname : ''
  const { onOpen: setLeavingAudiusModalOpen } = useLeavingAudiusModal()

  const handleClick: MouseEventHandler<HTMLAnchorElement> = useCallback(
    (e) => {
      if (!isAudiusUrl(e.currentTarget.href)) {
        e.nativeEvent.preventDefault()
        setLeavingAudiusModalOpen({ link: href })
      }
    },
    [setLeavingAudiusModalOpen, href]
  )

  useEffect(() => {
    if (willRender) {
      onSuccess?.()
    } else {
      onEmpty?.()
    }
  }, [willRender, onSuccess, onEmpty])

  return willRender ? (
    <a
      className={cn(styles.root, props.className)}
      href={href}
      title={title || siteName || description || 'View Image'}
      target={'_blank'}
      rel='noreferrer noopener'
      onClick={handleClick}
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
  ) : null
}
