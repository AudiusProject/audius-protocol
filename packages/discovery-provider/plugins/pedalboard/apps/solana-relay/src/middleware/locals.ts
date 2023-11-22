import { Users } from '@pedalboard/storage'

declare global {
  namespace Express {
    interface Locals {
      signer?: Users
    }
  }
}
