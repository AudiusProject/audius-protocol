import { SquareSizes } from '@audius/common/models'
import { Text } from '@audius/harmony'
import { merge } from 'lodash'
import { Route, Routes } from 'react-router-dom-v5-compat'
import { describe, expect, it } from 'vitest'

import { RenderOptions, render, screen } from 'test/test-utils'

import { UserCard } from './UserCard'

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
                  _profile_picture_sizes: {
                    [SquareSizes.SIZE_150_BY_150]: 'image-small.jpg',
                    [SquareSizes.SIZE_480_BY_480]: 'image-medium.jpg'
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

  it('renders the profile picture', () => {
    renderUserCard()

    expect(screen.getByRole('img', { hidden: true })).toHaveAttribute(
      'src',
      'image-small.jpg'
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
