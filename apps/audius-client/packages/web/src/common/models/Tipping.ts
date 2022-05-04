import { User } from './User'

export type Supporter = {
  supporter: User
  amount: number
  rank: number
  updated_at: string
}

export type Supporting = {
  supporting: User
  amount: number
  rank: number
  updated_at: string
}
