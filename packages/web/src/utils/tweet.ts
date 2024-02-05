import { makeTwitterShareUrl } from '@audius/common/utils'

export const openTwitterLink = (url: string | null, text: string) => {
  const twitterShareLink = makeTwitterShareUrl(url, text)

  window.open(
    twitterShareLink,
    '',
    'left=0,top=0,width=550,height=450,personalbar=0,toolbar=0,scrollbars=0,resizable=0'
  )
}
