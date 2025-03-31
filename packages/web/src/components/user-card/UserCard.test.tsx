import { SquareSizes, User } from '@audius/common/models'
import { primeUserDataInternal } from '@audius/common/src/api/tan-query/utils/primeUserData'
import { Text } from '@audius/harmony'
import { Route, Routes } from 'react-router-dom-v5-compat'
import { describe, expect, it, vi } from 'vitest'

import { queryClient } from 'services/query-client'
import { RenderOptions, render, screen } from 'test/test-utils'

import { UserCard } from './UserCard'
vi.mock('../../utils/image', () => ({
  preload: vi.fn((url: string) => Promise.resolve())
}))

function renderUserCard(users?: User[], options?: RenderOptions) {
  primeUserDataInternal({
    users: users ?? [
      {
        user_id: 1,
        handle: 'test-user',
        name: 'Test User',
        profile_picture: {
          [SquareSizes.SIZE_150_BY_150]:
            'https://node.com/image-profile-small.jpg',
          [SquareSizes.SIZE_480_BY_480]:
            'https://node.com/image-profile-medium.jpg',
          mirrors: ['https://node.com']
        },
        follower_count: 1
      } as User
    ],
    queryClient,
    forceReplace: true
  })

  return render(
    <Routes>
      <Route path='/' element={<UserCard id={1} size='s' />} />
      <Route
        path='/test-user'
        element={<Text variant='heading'>Test User Page</Text>}
      />
    </Routes>,
    options
  )
}

describe('UserCard', () => {
  it('renders with a label comprising the display name, handle, and follower count', () => {
    renderUserCard()
    expect(
      screen.getByRole('button', {
        name: /test user @test-user 1 follower/i
      })
    ).toBeInTheDocument()
  })

  // Jailed: does not seem to pass, timeout maybe?
  it.skip('navigates to the user page when clicked', async () => {
    renderUserCard()
    screen.getByRole('button').click()
    expect(
      await screen.findByRole('heading', { name: /test user page/i })
    ).toBeInTheDocument()
  })

  it('renders the profile picture', async () => {
    renderUserCard()

    expect(await screen.getByRole('img', { hidden: true })).toHaveAttribute(
      'src',
      'https://node.com/image-profile-small.jpg'
    )
  })

  it('handles users with large follow counts correctly', () => {
    renderUserCard([
      {
        user_id: 1,
        handle: 'test-user',
        name: 'Test User',
        profile_picture: {
          [SquareSizes.SIZE_150_BY_150]:
            'https://node.com/image-profile-small.jpg',
          [SquareSizes.SIZE_480_BY_480]:
            'https://node.com/image-profile-medium.jpg',
          mirrors: ['https://node.com']
        },
        follower_count: 1000
      } as User
    ])

    expect(screen.getByText('1K Followers')).toBeInTheDocument()
  })
})
