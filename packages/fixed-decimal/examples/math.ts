import { AUDIO } from '../src'

const a = AUDIO('123.123456789012345678')
const b = AUDIO(a.value * BigInt(2))

console.log(b.toLocaleString('en-US', { maximumFractionDigits: 2 }))
