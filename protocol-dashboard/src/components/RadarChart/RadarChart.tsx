import React from 'react'

import { Radar } from 'react-chartjs-2'

import Dropdown from 'components/Dropdown'
import Error from 'components/Error'
import Loading from 'components/Loading'
import Paper from 'components/Paper'
import { formatBucketText } from 'store/cache/analytics/hooks'
import { createStyles } from 'utils/mobile'

import desktopStyles from './RadarChart.module.css'
import mobileStyles from './RadarChartMobile.module.css'

const styles = createStyles({ desktopStyles, mobileStyles })

const getData = (data: number[], labels: string[]) => ({
  labels,
  datasets: [
    {
      backgroundColor: 'rgba(204,0,255,0.4)',
      pointRadius: 0,
      data
    }
  ]
})

const getOptions = () => ({
  layout: {
    padding: {
      left: 0
    }
  },
  scale: {
    angleLines: {
      color: 'rgba(90,94,120,1)'
    },
    gridLines: {
      display: true,
      color: ['rgba(90,94,120,1)', 'rgba(90,94,120,1)', 'rgba(119,124,150,1)']
    },
    ticks: {
      display: false,
      maxTicksLimit: 4,
      beginAtZero: true
    },
    pointLabels: {
      fontColor: 'rgba(190,197,224,1)',
      fontFamily: 'Avenir Next LT Pro',
      fontSize: 12,
      fontStyle: 'bold'
    }
  },
  legend: {
    display: false
  },
  tooltips: {
    enabled: false
  }
})

type OwnProps = {
  title: string
  labels: string[] | null
  data?: number[] | null
  error?: boolean
  options?: string[]
  selection?: string
  onSelectOption?: (option: string) => void
}

type RadarChartProps = OwnProps

const RadarChart: React.FC<RadarChartProps> = ({
  title,
  data,
  labels,
  error,
  options,
  selection,
  onSelectOption
}) => {
  return (
    <Paper className={styles.chartContainer}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        {options && selection && onSelectOption && (
          <div className={styles.dropdown}>
            <Dropdown
              selection={selection}
              options={options}
              onSelectOption={onSelectOption}
              textFormatter={formatBucketText}
            />
          </div>
        )}
      </div>
      <div className={styles.chart}>
        {error ? (
          <Error />
        ) : data && labels ? (
          <Radar data={getData(data, labels)} options={getOptions()} />
        ) : (
          <Loading className={styles.loading} />
        )}
      </div>
    </Paper>
  )
}

export default RadarChart
