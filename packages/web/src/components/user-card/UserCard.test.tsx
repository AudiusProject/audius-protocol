import { SquareSizes } from '@audius/common/models'
import { Text } from '@audius/harmony'
import { developmentConfig } from '@audius/sdk'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom-v5-compat'
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest'

import { RenderOptions, mswServer, render, screen } from 'test/test-utils'

import { UserCard } from './UserCard'

const { apiEndpoint } = developmentConfig.network

const testUser = {
  id: '7eP5n',
  handle: 'test-user',
  name: 'Test User',
  profile_picture: {
    [SquareSizes.SIZE_150_BY_150]: `${apiEndpoint}/image-profile-small.jpg`,
    [SquareSizes.SIZE_480_BY_480]: `${apiEndpoint}/image-profile-medium.jpg`,
    mirrors: [apiEndpoint]
  },
  follower_count: 1
}

function renderUserCard(overrides = {}, options?: RenderOptions) {
  const user = { ...testUser, ...overrides }

  mswServer.use(
    http.get(`${apiEndpoint}/v1/full/users`, ({ request }) => {
      const url = new URL(request.url)
      const id = url.searchParams.get('id')
      if (id === '7eP5n') {
        return HttpResponse.json({ data: [user] })
      }
      return new HttpResponse(null, { status: 404 })
    })
  )

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
  beforeAll(() => {
    mswServer.listen()
  })

  afterEach(() => {
    mswServer.resetHandlers()
  })

  afterAll(() => {
    mswServer.close()
  })

  it('renders with a label comprising the display name, handle, and follower count', async () => {
    renderUserCard()
    expect(
      await screen.findByRole('button', {
        name: /test user @test-user 1 follower/i
      })
    ).toBeInTheDocument()
  })

  it('navigates to the user page when clicked', async () => {
    renderUserCard()
    const userCard = await screen.findByRole('button', { name: /test user/i })
    userCard.click()
    expect(
      await screen.findByRole('heading', { name: /test user page/i })
    ).toBeInTheDocument()
  })

  it('renders the profile picture', async () => {
    renderUserCard()
    expect(await screen.findByRole('img')).toHaveAttribute(
      'src',
      `${apiEndpoint}/image-profile-small.jpg`
    )
  })

  it('handles users with large follow counts correctly', async () => {
    renderUserCard({ follower_count: 1000 })
    expect(await screen.findByText('1K Followers')).toBeInTheDocument()
  })
})
