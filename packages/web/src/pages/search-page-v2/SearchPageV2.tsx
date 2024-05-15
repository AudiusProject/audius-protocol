import { Status } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'
import { useSearchParams } from 'react-router-dom-v5-compat'
import { fullSearchResultsPage } from 'utils/route'
import {
  Flex,
  IconAlbum,
  IconComponent,
  IconNote,
  IconPlaylists,
  IconUser,
  LoadingSpinner,
  SelectablePill,
  Text
} from '@audius/harmony'
import { capitalize } from 'lodash'

type SearchHeaderProps = {
  title: string
  query: Nullable<string>
}

type Filter =
  | 'genre'
  | 'mood'
  | 'key'
  | 'bpm'
  | 'isPremium'
  | 'hasDownloads'
  | 'isVerified'

type Category = {
  filters: Filter[]
  icon?: IconComponent
}

const categories = {
  all: { filters: [] },
  profiles: { icon: IconUser, filters: ['genre', 'isVerified'] },
  tracks: {
    icon: IconNote,
    filters: ['genre', 'mood', 'key', 'bpm', 'isPremium', 'hasDownloads']
  },
  albums: { icon: IconAlbum, filters: ['genre', 'mood'] },
  playlists: { icon: IconPlaylists, filters: ['genre', 'mood'] }
} satisfies Record<string, Category>

const SearchHeader = (props: SearchHeaderProps) => {
  const secondary = (
    <Flex ml='l'>
      <Text variant='heading' strength='weak'>
        &#8220;{props.query}&#8221;
      </Text>
    </Flex>
  )
  return (
    <Header
      {...props}
      primary={props.title}
      secondary={secondary}
      rightDecorator={
        <Flex gap='s' direction='row'>
          {Object.entries(categories).map(([key, category]) => (
            <SelectablePill
              label={capitalize(key)}
              size='large'
              icon={(category as Category).icon}
            />
          ))}
        </Flex>
      }
      variant='main'
    />
  )
}

export const SearchPageV2 = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q')

  const header = <SearchHeader query={query} title={'Search'} />

  return (
    <Page
      title={`${query}`}
      description={`Search results for ${query}`}
      // canonicalUrl={fullSearchResultsPage(query)}
      header={header}
    >
      {status === Status.LOADING ? <LoadingSpinner /> : <div>hi</div>}
    </Page>
  )
}
