import {
  Button,
  Flex,
  SelectablePill,
  IconFilter,
  TextLink,
  FilterButton
} from '@audius/harmony'

import {
  CollectionData,
  PaginatedTable
} from 'components/PaginatedTable/PaginatedTable'
import TableLayout from 'components/PaginatedTable/TableLayout'
import { trpc } from 'utils/trpc'

const Table = ({ data }: { data: CollectionData }) => {
  const displayErrors = (item: any) => {
    const parseErrs = item?.parse_errors || []
    const publishErrs = item?.publish_errors || []
    const errs = parseErrs.concat(publishErrs)

    const uniquePills = new Set<string>(
      errs.map((err: string) => {
        if (err.includes('failed to find an artist ID')) {
          return 'UserMatch'
        } else if (err.includes('failed to find a genre ID')) {
          return 'GenreMatch'
        }
        return 'UnknownError'
      })
    )

    return Array.from(uniquePills).map((label) => (
      <SelectablePill
        key={label}
        label={label}
        size='small'
        disabled
        isSelected
      />
    ))
  }

  const displayPublished = (item: any) => {
    if (!item?.entity_id) return <></>
    if (item?.sdk_upload_metadata?.title) {
      return (
        <TextLink
          href={`https://audius.co/track/${item.entity_id}`}
          textVariant='body'
          showUnderline
        >
          {item.entity_id}
        </TextLink>
      )
    } else if (item?.sdk_upload_metadata?.playlist_name) {
      return (
        <TextLink
          href={`https://audius.co/album/${item.entity_id}`}
          textVariant='body'
          showUnderline
        >
          {item.entity_id}
        </TextLink>
      )
    } else {
      return <>item.entity_id</>
    }
  }

  const displayDebug = (item: any) => {
    return (
      <>
        <TextLink
          href={`/admin/releases/${item._id}/xml`}
          textVariant='body'
          showUnderline
        >
          XML
        </TextLink>{' '}
        <TextLink
          href={`/admin/releases/${item._id}/doc`}
          textVariant='body'
          showUnderline
        >
          Doc
        </TextLink>
      </>
    )
  }

  return (
    <>
      <thead>
        <tr>
          <th>Release ID</th>
          <th>Type</th>
          <th>Audius User</th>
          <th>Audius Genre</th>
          <th>Problems</th>
          <th>Published?</th>
          <th>Debug</th>
        </tr>
      </thead>
      <tbody>
        {data.items.map((item: any) => (
          <tr key={item._id}>
            <td>{item._id}</td>
            <td>
              {item?.sdk_upload_metadata?.title
                ? 'track'
                : item?.sdk_upload_metadata?.playlist_name
                ? 'album'
                : 'unknown'}
            </td>
            <td>
              {item?.sdk_upload_metadata?.artist_id ||
                item?.sdk_upload_metadata?.playlist_owner_id}
            </td>
            <td>{item?.sdk_upload_metadata?.genre}</td>
            <td>{displayErrors(item)}</td>
            <td>{displayPublished(item)}</td>
            <td>{displayDebug(item)}</td>
          </tr>
        ))}
      </tbody>
    </>
  )
}

const Releases = () => {
  const reprocessAllReleases = trpc.releases.reprocessAllReleases.useMutation()
  const reprocessErroredReleases =
    trpc.releases.reprocessErroredReleases.useMutation()

  return (
    <TableLayout title='Releases'>
      <Flex direction='row' gap='s' alignItems='center'>
        <Button
          variant='secondary'
          size='small'
          onClick={() => reprocessAllReleases.mutate()}
        >
          Re-Process All
        </Button>
        <Button
          variant='secondary'
          size='small'
          onClick={() => reprocessErroredReleases.mutate()}
        >
          Re-Process Errors
        </Button>
        <FilterButton
          iconRight={IconFilter}
          options={[
            { value: 'UserMatch' },
            { value: 'GenreMatch' },
            { value: 'UnknownError' },
            { value: 'Published' },
            { value: 'Unpublished' }
          ]}
        />
      </Flex>
      <PaginatedTable
        queryFunction={trpc.releases.getReleases.useQuery}
        TableDisplay={Table}
      />
    </TableLayout>
  )
}

export default Releases
