import { z } from 'zod'

import { HashId } from '../../types/HashId'
import { isEthAddressValid } from '../../utils/ethAddress'

export const CreateDashboardWalletUser = z
  .object({
    wallet: z.custom<string>((data: unknown) => {
      return isEthAddressValid(data as string)
    }),
    userId: HashId,
    walletSignature: z
      .object({
        /** Message should be of the form: "Connecting Audius user id a93jl at 39823489" */
        message: z.string(),
        signature: z.string()
      })
      .optional(),
    userSignature: z
      .object({
        /** Message should be of the form: "Connecting Audius protocol dashboard wallet 0x6c9CA7D9580d4e8286B0628c0300A2A1235a8e2E at 39823489" */
        message: z.string(),
        signature: z.string()
      })
      .optional()
  })
  .refine(
    (data) => !!data.userSignature || !!data.walletSignature,
    "Either `userSignature` or `walletSignature` is required. Use `userSignature` if SDK is authenticated with the wallet's sign methods, and use `walletSignature` if SDK is authenticated with the user's sign methods."
  )

export type CreateDashboardWalletUserRequest = z.input<
  typeof CreateDashboardWalletUser
>

export const DeleteDashboardWalletUserSchema = z.object({
  userId: HashId,
  wallet: z.custom<string>((data: unknown) => {
    return isEthAddressValid(data as string)
  })
})

export type DeleteDashboardWalletUserRequest = z.input<
  typeof DeleteDashboardWalletUserSchema
>
