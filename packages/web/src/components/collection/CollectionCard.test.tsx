import { SquareSizes } from '@audius/common/models'
import { Text } from '@audius/harmony'
import { Routes, Route } from 'react-router-dom-v5-compat'
import { describe, it, expect } from 'vitest'

import { render, screen } from 'test/test-utils'

import { CollectionCard } from './CollectionCard'

function renderCollectionCard() {
  return render(
    <Routes>
      <Route path='/' element={<CollectionCard id={1} size='s' />} />
      <Route
        path='/test-user/test-collection'
        element={<Text variant='heading'>Test Collection Page</Text>}
      />
      <Route
        path='/test-user'
        element={<Text variant='heading'>Test User Page</Text>}
      />
    </Routes>,
    {
      reduxState: {
        collections: {
          entries: {
            1: {
              metadata: {
                playlist_id: 1,
                playlist_name: 'Test Collection',
                playlist_owner_id: 2,
                permalink: '/test-user/test-collection',
                repost_count: 10,
                save_count: 5,
                _cover_art_sizes: {
                  [SquareSizes.SIZE_150_BY_150]: 'image-small.jpg',
                  [SquareSizes.SIZE_480_BY_480]: 'image-medium.jpg'
                }
              }
            }
          }
        },
        users: {
          entries: {
            2: { metadata: { handle: 'test-user', name: 'Test User' } }
          }
        }
      }
    }
  )
}

describe('CollectionCard', () => {
  it('renders a button with the label comprising the collection and artist name', () => {
    renderCollectionCard()
    expect(
      screen.getByRole('button', {
        name: /test collection test user/i
      })
    ).toBeInTheDocument()
  })

  it('navigates to collection page when clicked', async () => {
    renderCollectionCard()
    screen.getByRole('button').click()
    expect(
      await screen.findByRole('heading', { name: /test collection page/i })
    ).toBeInTheDocument()
  })

  it('renders the cover image', () => {
    renderCollectionCard()
    expect(screen.getByTestId(`${1}-cover-art`)).toBeInTheDocument()
  })

  it('renders the title', () => {
    renderCollectionCard()
    const titleElement = screen.getByText('Test Collection')
    expect(titleElement).toBeInTheDocument()
  })

  it('renders the collection owner link which navigates to user page', async () => {
    renderCollectionCard()
    const userNameElement = screen.getByRole('link', { name: 'Test User' })
    expect(userNameElement).toBeInTheDocument()
    userNameElement.click()
    expect(
      await screen.findByRole('heading', { name: /test user page/i })
    ).toBeInTheDocument()
  })

  it('shows the number of reposts and favorites with the correct screen-reader text', () => {
    renderCollectionCard()
    expect(screen.getByTitle('Reposts')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()

    expect(screen.getByTitle('Favorites')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
