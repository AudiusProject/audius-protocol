import { AUDIO } from '../src'

const audio = AUDIO('123.123456789012345678')

console.log(audio.value)
console.log(audio.toLocaleString())
console.log(audio.toLocaleString('en-US', { maximumFractionDigits: 2 }))
console.log(audio.toLocaleString('en-US', { maximumFractionDigits: 6 }))
