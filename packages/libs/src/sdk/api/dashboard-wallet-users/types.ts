import { z } from 'zod'

import { HashId } from '../../types/HashId'
import { isEthAddressValid } from '../../utils/ethAddress'

export const CreateDashboardWalletUser = z.object({
  wallet: z.custom<string>((data: unknown) => {
    return isEthAddressValid(data as string)
  }),
  userId: HashId,
  walletSignature: z.object({
    /** Message should be of the form: "Connecting Audius user id a93jl at 39823489" */
    message: z.string(),
    signature: z.string()
  })
})

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
