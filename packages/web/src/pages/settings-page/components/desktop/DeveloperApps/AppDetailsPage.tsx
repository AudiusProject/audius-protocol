import { useCallback } from 'react'

import {
  IconCopy as IconCopyPlain,
  IconError as IconWarning,
  IconCaretRight,
  IconButton
} from '@audius/harmony'

import { Divider } from 'components/divider'
import Toast from 'components/toast/Toast'
import { MountPlacement } from 'components/types'
import { copyToClipboard } from 'utils/clipboardUtil'

import styles from './AppDetailsPage.module.css'
import { CreateAppPageProps, CreateAppsPages } from './types'

type AppDetailsPageProps = CreateAppPageProps

const AUDIUS_SDK_LINK = 'https://docs.audius.org/developers/sdk/'

const messages = {
  secretReminder:
    "Remember to save your API Secret. You won't be able to view it again.",
  description: 'Description',
  apiKey: 'api key',
  copyApiKeyLabel: 'copy api key',
  apiSecret: 'api secret',
  copyApiSecretLabel: 'copy api secret',
  copied: 'Copied!',
  readTheDocs: 'Read the Developer Docs',
  goBack: 'Back to Your Apps'
}

export const AppDetailsPage = (props: AppDetailsPageProps) => {
  const { params, setPage } = props

  const handleGoBack = useCallback(() => {
    setPage(CreateAppsPages.YOUR_APPS)
  }, [setPage])

  const { name, description, apiKey, apiSecret } = params || {}
  const copyApiKey = useCallback(() => {
    if (!apiKey) return
    copyToClipboard(apiKey)
  }, [apiKey])

  const copySecret = useCallback(() => {
    if (!apiSecret) return
    copyToClipboard(apiSecret)
  }, [apiSecret])

  if (!params) return null

  return (
    <div className={styles.root}>
      {!apiSecret ? null : (
        <div className={styles.secretNotice}>
          <span className={styles.noticeTextRoot}>
            <IconWarning className={styles.noticeIcon} />
            <p className={styles.noticeText}>{messages.secretReminder}</p>
          </span>
          <a
            target='_blank'
            href={AUDIUS_SDK_LINK}
            className={styles.readTheDocs}
            rel='noreferrer'
          >
            {messages.readTheDocs}
          </a>
        </div>
      )}
      <h4 className={styles.appName}>{name}</h4>
      {!description ? null : (
        <span>
          <h5 className={styles.descriptionLabel}>{messages.description}</h5>
          <p className={styles.description}>{description}</p>
        </span>
      )}
      <div className={styles.keyRoot}>
        <span className={styles.keyLabel}>{messages.apiKey}</span>
        <Divider type='vertical' className={styles.keyDivider} />
        <span className={styles.keyText}>{apiKey}</span>
        <Divider type='vertical' className={styles.keyDivider} />
        <span>
          <Toast text={messages.copied} mount={MountPlacement.PARENT}>
            <IconButton
              onClick={copyApiKey}
              aria-label={messages.copyApiKeyLabel}
              color='subdued'
              icon={IconCopyPlain}
            />
          </Toast>
        </span>
      </div>
      {!apiSecret ? null : (
        <div className={styles.keyRoot}>
          <span className={styles.keyLabel}>{messages.apiSecret}</span>
          <Divider type='vertical' className={styles.keyDivider} />
          <span className={styles.keyText}>{apiSecret}</span>
          <Divider type='vertical' className={styles.keyDivider} />
          <span>
            <Toast text={messages.copied} mount={MountPlacement.PARENT}>
              <IconButton
                onClick={copySecret}
                aria-label={messages.copyApiKeyLabel}
                color='subdued'
                icon={IconCopyPlain}
              />
            </Toast>
          </span>
        </div>
      )}
      <button className={styles.goBack} onClick={handleGoBack}>
        <IconCaretRight className={styles.goBackIcon} />
        <span className={styles.goBackText}>{messages.goBack}</span>
      </button>
    </div>
  )
}
