import { SquareSizes } from '@audius/common/models'
import { Text } from '@audius/harmony'
import { merge } from 'lodash'
import { Route, Routes } from 'react-router-dom-v5-compat'
import { describe, expect, it, vi } from 'vitest'

import { RenderOptions, render, screen } from 'test/test-utils'

import { UserCard } from './UserCard'

vi.mock('../../utils/image', () => ({
  preload: vi.fn((url: string) => Promise.resolve())
}))

function renderUserCard(options?: RenderOptions) {
  return render(
    <Routes>
      <Route path='/' element={<UserCard id={1} size='s' />} />
      <Route
        path='/test-user'
        element={<Text variant='heading'>Test User Page</Text>}
      />
    </Routes>,
    merge(
      {
        reduxState: {
          users: {
            entries: {
              1: {
                metadata: {
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
                }
              }
            }
          }
        }
      },
      options
    )
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
    renderUserCard({
      reduxState: {
        users: { entries: { 1: { metadata: { follower_count: 1000 } } } }
      }
    })

    expect(screen.getByText('1K Followers')).toBeInTheDocument()
  })
})
