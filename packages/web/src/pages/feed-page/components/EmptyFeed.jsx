import { memo } from 'react'

import { Button } from '@audius/harmony'
import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './EmptyFeed.module.css'
import FollowArtists from './FollowUsers'

const messages = {
  noFollowers: `Oops! There's nothing here.`
}

const EmptyFeed = (props) => {
  return (
    <div className={cn(styles.emptyFeed)}>
      {props.hasAccount ? null : (
        <div className={styles.banner}>
          <div className={styles.bannerText}>
            {`You'll Need An Account Before You Can Use Your Feed!`}
          </div>
        </div>
      )}
      <div className={styles.contentWrapper}>
        <div className={styles.body}>
          {props.hasAccount ? (
            <FollowArtists
              header={
                <>
                  {messages.noFollowers}{' '}
                  <i className='emoji face-screaming-in-fear' />
                </>
              }
              fetchFollowUsers={props.fetchFollowUsers}
              followUsers={props.followUsers}
              users={props.suggestedFollows}
            />
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
              <Button variant='primary' size='small' onClick={props.onClick}>
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

EmptyFeed.propTypes = {
  hasAccount: PropTypes.bool,
  onClick: PropTypes.func,
  fetchFollowUsers: PropTypes.func,
  followUsers: PropTypes.func,
  suggestedFollows: PropTypes.arrayOf(
    PropTypes.shape({
      user_id: PropTypes.number,
      name: PropTypes.string,
      handle: PropTypes.string,
      is_verified: PropTypes.bool,
      follower_count: PropTypes.number
    })
  )
}

export default memo(EmptyFeed)
