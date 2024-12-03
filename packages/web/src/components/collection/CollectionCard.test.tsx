import { SquareSizes } from '@audius/common/models'
import { Text } from '@audius/harmony'
import { merge } from 'lodash'
import { Routes, Route } from 'react-router-dom-v5-compat'
import { describe, it, expect, vi } from 'vitest'

import { RenderOptions, render, screen } from 'test/test-utils'

import { CollectionCard } from './CollectionCard'

vi.mock('../../utils/image', () => ({
  preload: vi.fn((url: string) => Promise.resolve())
}))

function renderCollectionCard(options?: RenderOptions) {
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
    merge(
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
                  artwork: {
                    [SquareSizes.SIZE_150_BY_150]:
                      'https://node.com/image-small.jpg',
                    [SquareSizes.SIZE_480_BY_480]:
                      'https://node.com/image-medium.jpg',
                    mirrors: ['https://node.com']
                  },
                  access: { stream: true }
                }
              }
            }
          },
          users: {
            entries: {
              2: { metadata: { handle: 'test-user', name: 'Test User' } }
            },
            handles: {
              'test-user': 2
            }
          }
        }
      },
      options
    )
  )
}

describe('CollectionCard', () => {
  it('renders a button with the label comprising the collection and artist name, and favorites and reposts', () => {
    renderCollectionCard()
    expect(
      screen.getByRole('button', {
        name: /test collection test user reposts 10 favorites 5/i
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

  it('renders the cover image', async () => {
    renderCollectionCard()
    expect(await screen.findByTestId('cover-art-1')).toHaveAttribute(
      'src',
      'https://node.com/image-medium.jpg'
    )
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

  it('hidden collections are rendered correctly', () => {
    renderCollectionCard({
      reduxState: {
        collections: { entries: { 1: { metadata: { is_private: true } } } }
      }
    })

    expect(
      screen.getByRole('button', { name: /test collection test user hidden/i })
    ).toBeInTheDocument()
  })

  it('premium locked collections are rendered correctly', () => {
    renderCollectionCard({
      reduxState: {
        collections: {
          entries: {
            1: {
              metadata: {
                access: { stream: false },
                stream_conditions: {
                  usdc_purchase: { price: 10, albumTrackPrice: 1, splits: {} }
                }
              }
            }
          }
        }
      }
    })
    expect(
      screen.getByRole('button', {
        name: /test collection test user reposts 10 favorites 5 available for purchase/i
      })
    )
  })

  it('premium unlocked collections are rendered correctly', () => {
    renderCollectionCard({
      reduxState: {
        collections: {
          entries: {
            1: {
              metadata: {
                access: { stream: true },
                stream_conditions: {
                  usdc_purchase: { price: 10, albumTrackPrice: 1, splits: {} }
                }
              }
            }
          }
        }
      }
    })
    expect(
      screen.getByRole('button', {
        name: /test collection test user reposts 10 favorites 5 purchased/i
      })
    )
  })

  it('premium collections owned by user are rendered correctly', () => {
    renderCollectionCard({ reduxState: { account: { userId: 2 } } })

    // Expect the locked icon to not exist
    expect(
      screen.getByRole('button', {
        name: 'Test Collection Test User Reposts 10 Favorites 5'
      })
    ).toBeInTheDocument()
  })
})
