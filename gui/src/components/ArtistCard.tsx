import {
  HoverCard,
  Button,
  Text,
  Avatar,
  Image,
  Center,
  Group,
  Box,
  Badge,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { LinkTo } from './LinkTo'

type Props = {
  user: {
    id: string
    name: string
    handle: string
    bio?: string | null

    track_count: number
    follower_count: number
    following_count: number

    is_followed: boolean
    is_follower: boolean

    cover_photo_urls: string[]
    profile_picture_urls: string[]
  }
}

export function ArtistCard({ user }: Props) {
  return (
    <Group>
      <HoverCard width={400} position="left" shadow="md">
        <HoverCard.Target>
          <div>
            <LinkTo item={user}>{user.name}</LinkTo>
          </div>
        </HoverCard.Target>
        <HoverCard.Dropdown sx={{ border: 0, overflow: 'hidden' }} p={0}>
          <div
            style={{
              backgroundColor: '#333',
              backgroundImage: `url(${user.cover_photo_urls[0]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: 100,
            }}
          >
            <Group>
              <Avatar src={user.profile_picture_urls[0]} size="lg" />
              <Box sx={{ color: 'white' }}>
                <Text>{user.name}</Text>
                <Text>@{user.handle}</Text>
              </Box>
            </Group>
          </div>
          <Group grow sx={{ textAlign: 'center' }}>
            <StatBox value={user.track_count} label="Tracks" />
            <StatBox value={user.follower_count} label="Followers" />
            <StatBox value={user.following_count} label="Following" />
          </Group>
          <Text c="dimmed" fz="xs" p="md">
            {user.bio}
          </Text>
          <Box p="md">
            {user.is_followed ? (
              <Button>Followed</Button>
            ) : (
              <Button>Follow</Button>
            )}
            {user.is_follower && <Badge>Follows You</Badge>}
          </Box>
        </HoverCard.Dropdown>
      </HoverCard>
    </Group>
  )
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <Text fz="lg" fw={700}>
        {value}
      </Text>
      <Text c="dimmed" sx={{ textTransform: 'uppercase' }}>
        {label}
      </Text>
    </div>
  )
}
