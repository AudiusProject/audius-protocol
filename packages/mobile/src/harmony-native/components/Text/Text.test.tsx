import { render, screen } from '@testing-library/react-native'

import { Text } from './Text'

test('renders text correctly', () => {
  render(<Text>hello world</Text>)

  expect(screen.getByText(/hello world/i)).toBeOnTheScreen()
})

test('it renders display variant correctly', () => {
  render(<Text variant='display'>test display</Text>)

  expect(
    screen.getByRole('heading', { name: /test display/i })
  ).toBeOnTheScreen()
})

test('it renders heading variant correctly', () => {
  render(<Text variant='heading'>test heading</Text>)

  expect(
    screen.getByRole('heading', { name: /test heading/i })
  ).toBeOnTheScreen()
})

test('it renders labels correctly', () => {
  render(<Text variant='label'>test label</Text>)

  expect(screen.getByText(/test label/i)).toHaveStyle({
    textTransform: 'uppercase'
  })
})

test('it renders color correctly', () => {
  render(<Text color='subdued'>test label</Text>)

  expect(screen.getByText(/test label/i)).toHaveStyle({
    color: '#C2C0CC'
  })
})
