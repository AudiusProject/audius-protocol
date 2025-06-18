import { useMutation } from '@tanstack/react-query'

import { useQueryContext } from '~/api/tan-query/utils'

type ResetPasswordArgs = {
  email: string
  password: string
}

export const useResetPassword = () => {
  const { authService } = useQueryContext()
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
