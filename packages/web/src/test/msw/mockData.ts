import { User } from '@audius/common/models'

// TODO: make these use stronger types
export const mockData = (mockUser: User) => ({
  users: {
    connected_wallets: { data: { erc_wallets: [], spl_wallets: [] } },
    userByHandle: { data: [mockUser] },
    collectibles: { data: null },
    supporting: { data: [] },
    supporters: { data: [] },
    related: { data: [] }
  },
  events: { data: [] }
})
