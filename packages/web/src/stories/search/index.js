import React from 'react'

import { storiesOf } from '@storybook/react'

import SearchBar from 'components/search/SearchBar'
import SearchBarResult from 'components/search/SearchBarResult'

const SearchBarDataSource = {
  sections: [
    {
      title: 'Tracks',
      children: [
        {
          key: 1,
          primary: 'Pink + White',
          secondary: 'Frank Ocean',
          imageUrl: ''
        }
      ]
    },
    {
      title: 'Artists',
      children: [
        {
          key: 2,
          primary: 'Frank Ocean'
        },
        {
          key: 'chance',
          primary: 'Chance the Rapper'
        },
        {
          key: 'cili',
          primary: 'Red Hot Chili Peppers'
        }
      ]
    },
    {
      title: 'Playlists',
      children: [
        {
          key: 3,
          primary: `Rap Beats`,
          secondary: '2 Listeners'
        },
        {
          key: 'hip-hop',
          primary: `Hip-Hop Beats`,
          secondary: '2 Listeners'
        },
        {
          key: 'jazz',
          primary: `Jazz Beats`,
          secondary: '2 Listeners'
        },
        {
          key: 'extra',
          primary: `Extra`,
          secondary: '2 Listeners'
        }
      ]
    },
    {
      title: 'Albums',
      children: [
        {
          key: 4,
          primary: 'Coloring Book',
          secondary: 'Chance the Rapper'
        }
      ]
    }
  ]
}

const CenteredBackground = props => (
  <div
    style={{
      width: '100vw',
      height: '100vh',
      display: 'inline-flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#eff3f4',
      ...(props.styles || {})
    }}
  >
    {props.children}
  </div>
)

export default () => {
  return storiesOf('Search', module)
    .add('SearchBar', () => {
      return <SearchBar dataSource={SearchBarDataSource} resultsCount={2} />
    })
    .add('SearchBarResult', () => {
      return (
        <CenteredBackground>
          <SearchBarResult
            primary={'Get Schwifty'}
            secondary={'Rick Sanchez & Morty Smith'}
            isUser={false}
          />
        </CenteredBackground>
      )
    })
}
