import React from 'react'

import { storiesOf } from '@storybook/react'

import TotalPlaysChart from 'containers/artist-dashboard-page/components/TotalPlaysChart'

export default () => {
  return storiesOf('ArtistDashboard', module).add('TotalPlaysChart', () => {
    return <TotalPlaysChart />
  })
}
