export const openTwitterLink = (url: string, text: string) => {
  window.open(
    `http://twitter.com/share?url=${encodeURIComponent(
      url
    )}&text=${encodeURIComponent(text)}`,
    '',
    'left=0,top=0,width=550,height=450,personalbar=0,toolbar=0,scrollbars=0,resizable=0'
  )
}
