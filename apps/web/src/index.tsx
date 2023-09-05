/* eslint-disable import/order */
import { setupTracing } from './tracer'
setupTracing()

// eslint-disable-next-line import/first
import ReactDOM from 'react-dom'
import { render } from 'react-nil'

import './index.css'

// Import CSS first so it's resolved in the right order.
// Unsure why importing this component first would change that, but it appears to
// when running in dev mode.
import Root from './root'

const NATIVE_NAVIGATION_ENABLED =
  process.env.REACT_APP_NATIVE_NAVIGATION_ENABLED === 'true'

if (NATIVE_NAVIGATION_ENABLED) {
  render(<Root />)
} else {
  ReactDOM.render(<Root />, document.getElementById('root'))
}
