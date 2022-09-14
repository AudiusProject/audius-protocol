/* eslint-disable import/order */
/* eslint-disable import/first */
import { setupTracing } from './utils/tracer'
setupTracing()

// eslint-disable-next-line import/first
import ReactDOM from 'react-dom'

import './index.css'

// Import CSS first so it's resolved in the right order.
// Unsure why importing this component first would change that, but it appears to
// when running in dev mode.
import Root from './root'

ReactDOM.render(<Root />, document.getElementById('root'))
