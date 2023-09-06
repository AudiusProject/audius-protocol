export const shadeColor = (color, percent) => {
  const raw = color.replace('rgb(', '').replace(')', '').split(',')

  let r = Math.round((parseInt(raw[0], 10) * (100 + percent)) / 100)
  let g = Math.round((parseInt(raw[1], 10) * (100 + percent)) / 100)
  let b = Math.round((parseInt(raw[2], 10) * (100 + percent)) / 100)

  r = r < 255 ? r : 255
  g = g < 255 ? g : 255
  b = b < 255 ? b : 255

  return `rgb(${r},${g},${b})`
}
