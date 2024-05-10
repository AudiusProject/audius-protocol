import { accountSelectors } from '@audius/common/store'
import { Button } from '@audius/harmony'
import cn from 'classnames'
import { Link } from 'react-router-dom'

import { useSelector } from 'utils/reducer'
import { SIGN_UP_PAGE } from 'utils/route'

import styles from './EmptyFeed.module.css'
import FollowArtists from './FollowUsers'

const EmptyFeed = () => {
  const hasAccount = useSelector(accountSelectors.getHasAccount)

  return (
    <div className={cn(styles.emptyFeed)}>
      {hasAccount ? null : (
        <div className={styles.banner}>
          <div className={styles.bannerText}>
            {`You'll Need An Account Before You Can Use Your Feed!`}
          </div>
        </div>
      )}
      <div className={styles.contentWrapper}>
        <div className={styles.body}>
          {hasAccount ? (
            <FollowArtists />
          ) : (
            <>
              <div className={styles.title}>
                With an Audius account you can...
              </div>
              <div className={styles.item}>
                Follow your favorite artists{' '}
                <i className='emoji small grinning-face-with-star-eyes' />
              </div>
              <div className={styles.item}>
                Upload and share your music{' '}
                <i className='emoji small multiple-musical-notes' />
              </div>
              <div className={styles.item}>
                Create and publish playlists{' '}
                <i className='emoji small headphone' />
              </div>
              <div className={styles.item}>and much more!</div>
              <Button variant='primary' size='small' asChild>
                <Link to={SIGN_UP_PAGE}>Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmptyFeed
