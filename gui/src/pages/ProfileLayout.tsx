import { gql } from '@apollo/client'
import { Avatar, Badge, Box, Container, Group, Text } from '@mantine/core'
import { NavLink, Outlet, useLoaderData } from 'react-router-dom'
import { apolloClient } from '../clients'
import { ProfileLayoutQuery } from '../generated/graphql'

gql`
  query ProfileLayout($handle: String) {
    user(handle: $handle) {
      id
      handle
      name
      cover_photo_urls(size: _2000x)
      profile_picture_urls
      follower_count
      following_count

      is_follower
      is_followed
    }
  }
`

export function ProfileLayout() {
  const data = useLoaderData() as ProfileLayoutQuery
  const user = data.user!

  async function become() {
    if (!user) return
    localStorage.setItem('currentUserId', user.id)
    await apolloClient.clearStore()
    await apolloClient.refetchQueries({
      include: 'active',
    })
  }

  return (
    <div>
      {/* profile header cover stuff */}
      <div
        style={{
          position: 'relative',
          height: 450,
          backgroundImage: `url(${user.cover_photo_urls[0]})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          marginBottom: 100,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, .85) 90%)',
          }}
        ></div>
        <Group
          style={{
            position: 'absolute',
            bottom: -70,
            color: 'white',
          }}
        >
          <Avatar src={user.profile_picture_urls[0]} size={150} radius={150} />
          <div>
            <Text fz="xl" fw={700} sx={{ background: 'black' }}>
              {user.name}
            </Text>
            <Box sx={{ background: 'black' }} onClick={become}>
              @{user.handle}
            </Box>
            {user.is_follower && <Badge>Follows You</Badge>}
          </div>
        </Group>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <NavLink to={`/${user.handle}`}>profile</NavLink>
        <NavLink to={`reposts`}>Reposts</NavLink>
      </div>

      <Outlet />
    </div>
  )
}
