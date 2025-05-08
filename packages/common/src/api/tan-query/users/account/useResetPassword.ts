import { useMutation } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'

type ResetPasswordArgs = {
  email: string
  password: string
}

export const useResetPassword = () => {
  const { authService } = useAudiusQueryContext()
  return useMutation({
    mutationFn: async ({ email, password }: ResetPasswordArgs) => {
      await authService.resetPassword({
        username: email,
        password
      })
      return { status: 'ok' }
    }
  })
}
