import { ShareMessage } from 'services/native-mobile-interface/share'
import { getIsIOS } from 'utils/browser'
import { isMobile } from 'utils/clientUtil'
import { copyLinkToClipboard, getCopyableLink } from 'utils/clipboardUtil'
const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

/**
 * Formats and shares a link with the system dialog if available and otherwise
 * copies to the clipboard.
 * @param url link to share
 * @param text text to include
 */
export const share = (url: string, text: string) => {
  const shareableLink = getCopyableLink(url)

  // @ts-ignore: navigator may have share field in updated browsers
  if (navigator.share && isMobile()) {
    navigator
      // @ts-ignore: navigator may have share field in updated browsers
      .share({
        text,
        url: shareableLink
      })
  } else {
    copyLinkToClipboard(url)
    if (NATIVE_MOBILE && !getIsIOS()) {
      const message = new ShareMessage({
        message: text,
        url: shareableLink
      })
      message.send()
    }
  }
}
