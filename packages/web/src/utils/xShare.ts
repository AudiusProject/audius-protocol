import { makeXShareUrl } from '@audius/common/utils'

export const openXLink = (url: string | null, text: string) => {
  const xShareLink = makeXShareUrl(url, text)

  window.open(
    xShareLink,
    '',
    'left=0,top=0,width=550,height=450,personalbar=0,toolbar=0,scrollbars=0,resizable=0'
  )
}
