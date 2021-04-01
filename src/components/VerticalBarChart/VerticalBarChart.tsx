import Loading from 'components/Loading'
import Paper from 'components/Paper'
import React from 'react'
import { Bar } from 'react-chartjs-2'
import { formatShortNumber } from 'utils/format'
import { IconCrown } from '@audius/stems'
// Custom draw fn
import 'components/BarChart/draw'

import desktopStyles from './VerticalBarChart.module.css'
import mobileStyles from './VerticalBarChartMobile.module.css'
import { createStyles } from 'utils/mobile'
import { useIsMobile } from 'utils/hooks'
import Error from 'components/Error'

const styles = createStyles({ desktopStyles, mobileStyles })

const getData = (data: number[], isMobile: boolean) => ({
  labels: data.map(d => formatShortNumber(d).toUpperCase()),
  datasets: [
    {
      backgroundColor: 'rgba(145, 71, 204, 0.7)',
      hoverBackgroundColor: 'rgba(145, 71, 204, 0.7)',
      borderWidth: 0,
      barThickness: isMobile ? 30 : 72,
      scale: {
        offset: false
      },
      data
    }
  ]
})

const getOptions = (max: number) => ({
  layout: {
    padding: {
      left: 0,
      right: 0
    }
  },
  scales: {
    xAxes: [
      {
        gridLines: {
          display: false,
          color: 'rgba(90,94,120,1)',
          drawBorder: true,
          offsetGridLines: false
        },
        ticks: {
          display: false,
          beginAtZero: true,
          max: max * 1.1
        }
      }
    ],
    yAxes: [
      {
        position: 'right',
        gridLines: {
          display: true,
          drawBorder: false,
          color: '#393A54',
          offset: false,
          offsetGridLines: false,
          zeroLineWidth: 1,
          zeroLineColor: '#393A54'
        },
        ticks: {
          mirror: true,
          padding: 10,
          labelOffset: -16,
          offset: true,
          z: 10,
          autoSkip: false,
          fontColor: '#BEC5E0',
          fontFamily: 'Avenir Next LT Pro',
          fontSize: 12,
          fontStyle: 'bold',
          callback: (value: number) => {
            return formatShortNumber(value).toUpperCase()
          }
        }
      }
    ]
  },
  legend: {
    display: false
  },
  tooltips: {
    enabled: false
  }
})

const Labels = ({ labels }: { labels: string[] }) => {
  return (
    <div className={styles.labelsContainer}>
      {labels.map((label, index) => (
        <div key={label} className={styles.labelContainer}>
          <IconCrown className={styles.crown} />
          <div className={styles.index}>{index + 1}</div>
          <div className={styles.label}>{label}</div>
        </div>
      ))}
    </div>
  )
}

type OwnProps = {
  title: string
  yLabel: string
  labels: string[] | null
  data?: number[] | null
  error?: boolean
  viewMore?: string
  onViewMore?: () => void
}

type VerticalBarChartProps = OwnProps

const VerticalBarChart: React.FC<VerticalBarChartProps> = ({
  title,
  yLabel,
  data,
  labels,
  error,
  viewMore,
  onViewMore
}) => {
  const isMobile = useIsMobile()
  const barData = data ? getData(data, isMobile) : null
  return (
    <Paper className={styles.chartContainer}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
      </div>
      <div className={styles.chart}>
        {error ? (
          <Error />
        ) : data && labels ? (
          <>
            <div className={styles.yLabel}>{yLabel}</div>
            <Bar
              height={100}
              data={barData}
              options={getOptions(Math.max(...data))}
            />
            <Labels labels={labels} />
          </>
        ) : (
          <Loading className={styles.loading} />
        )}
      </div>
      {!error && data && labels && viewMore && (
        <div className={styles.viewMore} onClick={onViewMore}>
          {viewMore}
        </div>
      )}
    </Paper>
  )
}

export default VerticalBarChart
