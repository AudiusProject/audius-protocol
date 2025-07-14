import { USDC } from '../src'

const usdc = USDC('12345.1234')

console.log(usdc.value)
console.log(usdc.toLocaleString())
console.log(usdc.toLocaleString('en-US', { maximumFractionDigits: 4 }))
