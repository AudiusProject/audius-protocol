import { Button, ButtonType } from '@audius/stems'
import { Link } from 'react-router-dom'

import { SIGN_UP_PAGE } from 'utils/route'

const messages = {
  header: 'Sign Into Audius',
  createAccount: 'Create An Account'
}

export const SignInPage = () => {
  return (
    <div>
      <h1>{messages.header}</h1>
      <Button
        type={ButtonType.COMMON}
        text={messages.createAccount}
        as={Link}
        to={SIGN_UP_PAGE}
      ></Button>
    </div>
  )
}
