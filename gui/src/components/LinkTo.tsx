import { Anchor, AnchorProps } from '@mantine/core'
import { Link } from 'react-router-dom'

type LinkToProps = AnchorProps<any> & {
  item: any
  suffix?: string
  children: any
}

export function LinkTo({ item, suffix, children, ...rest }: LinkToProps) {
  let u = urlFor(item)
  if (!u) return <div>Don't know how to link to {item.__typename}</div>
  if (suffix) {
    u += `/${suffix}`
  }

  return (
    <Anchor component={Link} to={u} {...rest}>
      {children}
    </Anchor>
  )
}

export function urlFor(item: any) {
  switch (item.__typename) {
    case 'User':
      return `/${item.handle}`

    case 'Playlist':
      return `/${item.user.handle}/playlists/${slugify(
        item.playlist_name,
        item.id
      )}`

    case 'Track':
      return `/${item.route_id}-${item.id}`
    // return `/${item.artist.handle}/${slugify(item.title, item.id)}`
  }
}

function slugify(name: string, id?: any) {
  let slug = name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-')
  if (id) {
    slug += '-' + id
  }
  return slug
}
