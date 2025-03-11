export const uuid = () => {
  // https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/873856#873856
  const s = []
  const hexDigits = '0123456789abcdef'
  // all the ts-ignores are needed so the mobile package types things correctly
  // remove when upgrading to latest typescript
  for (let i = 0; i < 36; i++) {
    // @ts-ignore
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
  }
  // @ts-ignore
  s[14] = '4' // bits 12-15 of the time_hi_and_version field to 0010
  // @ts-ignore
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1) // bits 6-7 of the clock_seq_hi_and_reserved to 01
  // @ts-ignore
  s[8] = s[13] = s[18] = s[23] = '-'

  const uuid = s.join('')
  return uuid
}
