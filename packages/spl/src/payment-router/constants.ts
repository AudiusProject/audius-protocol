import { PublicKey } from '@solana/web3.js'

export enum PaymentRouterInstruction {
  createPaymentRouterBalancePDA = 0,
  route = 1
}

export const PAYMENT_ROUTER_PROGRAM_ID = new PublicKey(
  'paytYpX3LPN98TAeen6bFFeraGSuWnomZmCXjAsoqPa'
)
