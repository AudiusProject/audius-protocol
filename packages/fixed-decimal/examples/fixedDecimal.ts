import { FixedDecimal } from '../src'

const a = new FixedDecimal('123.123456789012345678')

console.log(a.value)
console.log(a.toLocaleString())
console.log(a.toLocaleString('en-US', { maximumFractionDigits: 2 }))
console.log(a.toLocaleString('en-US', { maximumFractionDigits: 6 }))
