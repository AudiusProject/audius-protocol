import { act, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'

import { BalanceLineChart } from './BalanceLineChart'

const data = [120.5, 135, 128, 160, 155, 190.25, 175, 210].map((value, i) => ({
  value,
  timestamp: 1700000000000 + i * 86400000
}))

const renderChart = () =>
  render(
    <BalanceLineChart
      data={data}
      containerWidth={343}
      plotHeight={191}
      axisLabelWidth={50}
      axisLabelPaddingRight={8}
      lineColor='#7E1BCC'
      startFillColor='rgba(126, 27, 204, 0.15)'
      endFillColor='rgba(126, 27, 204, 0.05)'
      ruleColor='#E7E6EB'
      axisLabelColor='#A1A0A7'
      formatAxisLabel={(value) => `$${value.toFixed(0)}`}
      renderTooltip={({ value }) => <Text>{`tooltip ${value}`}</Text>}
    />
  )

const touch = (locationX: number) =>
  ({ nativeEvent: { locationX, locationY: 50 } }) as any

describe('BalanceLineChart', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('renders the axis labels and the line', () => {
    renderChart()
    expect(screen.getByText('$112')).toBeOnTheScreen()
    expect(screen.getByText('$162')).toBeOnTheScreen()
    expect(screen.getByText('$212')).toBeOnTheScreen()
    expect(screen.getByTestId('balance-chart-line')).toBeOnTheScreen()
    expect(screen.queryByTestId('balance-chart-tooltip')).toBeNull()
  })

  it('shows the nearest value while scrubbing and hides it after release', () => {
    renderChart()
    const plot = screen.getByTestId('balance-chart-plot')

    act(() => plot.props.onResponderGrant(touch(160)))
    expect(screen.getByText('tooltip 155')).toBeOnTheScreen()
    expect(screen.getByTestId('balance-chart-pointer')).toBeOnTheScreen()

    act(() => plot.props.onResponderMove(touch(300)))
    expect(screen.getByText('tooltip 210')).toBeOnTheScreen()

    act(() => plot.props.onResponderRelease(touch(300)))
    act(() => jest.advanceTimersByTime(3999))
    expect(screen.getByText('tooltip 210')).toBeOnTheScreen()
    act(() => jest.advanceTimersByTime(1))
    expect(screen.queryByTestId('balance-chart-tooltip')).toBeNull()
    expect(screen.queryByTestId('balance-chart-pointer')).toBeNull()
  })

  it('keeps the pointer when touched again before it vanishes', () => {
    renderChart()
    const plot = screen.getByTestId('balance-chart-plot')

    act(() => plot.props.onResponderGrant(touch(20)))
    act(() => plot.props.onResponderRelease(touch(20)))
    act(() => jest.advanceTimersByTime(3000))
    act(() => plot.props.onResponderGrant(touch(20)))
    act(() => jest.advanceTimersByTime(2000))
    expect(screen.getByText('tooltip 120.5')).toBeOnTheScreen()
  })
})
