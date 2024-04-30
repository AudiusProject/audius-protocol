import { SquareSizes } from '@audius/common/models'
import { Text } from '@audius/harmony'
import { merge } from 'lodash'
import { Route, Routes } from 'react-router-dom-v5-compat'

import { RenderOptions, render, screen } from 'test/test-utils'

import { UserCard } from './UserCard'
import { describe, expect, it } from 'vitest'

function renderUserCard(options?: RenderOptions) {
  return render(
    <Routes>
      <Route path='/' element={<UserCard id={1} size='s' />} />
      <Route
        path='/test-user/test-collection'
        element={<Text variant='heading'>Test Collection Page</Text>}
      />
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
              2: {
                metadata: {
                  handle: 'test-user',
                  name: 'Test User',
                  _profile_picture_sizes: {
                    [SquareSizes.SIZE_150_BY_150]: 'image-small.jpg',
                    [SquareSizes.SIZE_480_BY_480]: 'image-medium.jpg'
                  }
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
        name: /test collection test user reposts 10 favorites 5/i
      })
    ).toBeInTheDocument()
  })
})
