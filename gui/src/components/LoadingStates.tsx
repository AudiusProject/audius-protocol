import { ApolloError } from '@apollo/client'

type Props = {
  loading: boolean
  error: ApolloError | undefined
}

export function LoadingStates({ loading, error }: Props) {
  if (loading) return <div>loading</div>
  if (error) return <div>error</div>
  return null
}
