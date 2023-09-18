import { useCallback } from 'react'

import {
  HarmonyButton,
  HarmonyButtonSize,
  HarmonyButtonType,
  IconDownload
} from '@audius/stems'

import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { downloadFile } from 'utils/fileDownload'

const messages = {
  downloadCSV: 'Download CSV'
}

type CSVDownloadButtonProps = {
  url: string
}

export const CSVDownloadButton = ({ url }: CSVDownloadButtonProps) => {
  const downloadCSV = useCallback(async () => {
    const { data, signature } =
      await audiusBackendInstance.signDiscoveryNodeRequest()
    const headers = {
      'encoded-data-message': data,
      'encoded-data-signature': signature
    }
    downloadFile({
      url,
      headers
    })
  }, [url])

  return (
    <HarmonyButton
      onClick={downloadCSV}
      text={messages.downloadCSV}
      variant={HarmonyButtonType.SECONDARY}
      size={HarmonyButtonSize.SMALL}
      iconLeft={IconDownload}
    />
  )
}
