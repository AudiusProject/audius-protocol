import { Box } from '@audius/harmony'

import styles from './GiantArtwork.module.css'

type ServerGiantArtworkProps = {
  coSign: any | null
  cid: string | null
  overrideArtwork?: string
}

const messages = {
  artworkAltText: 'Track Artwork'
}

export const ServerGiantArtwork = ({
  overrideArtwork
}: ServerGiantArtworkProps) => {
  return (
    <div className={styles.giantArtwork}>
      <Box
        h={'100%'}
        w={'100%'}
        className={styles.imageWrapper}
        css={{ overflow: 'hidden' }}
      >
        <img
          css={{
            height: '100%',
            width: '100%',
            maxWidth: '100%',
            objectFit: 'cover'
          }}
          src={overrideArtwork}
          alt={messages.artworkAltText}
        />
      </Box>
    </div>
  )
}
