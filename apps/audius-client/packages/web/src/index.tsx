import ReactDOM from 'react-dom'

import './index.css'

// Import CSS first so it's resolved in the right order.
// Unsure why importing this component first would change that, but it appears to
// when running in dev mode.
import Root from './root'

ReactDOM.render(<Root />, document.getElementById('root'))
