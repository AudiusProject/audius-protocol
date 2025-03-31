import { ID, WidthSizes } from '@audius/common/models'
import { Paper, PaperProps } from '@audius/harmony'

import { useCoverPhoto } from 'hooks/useCoverPhoto'

type CoverPhotoV2Props = {
  userId: ID
  size?: WidthSizes
} & Partial<PaperProps>

export const CoverPhotoV2 = ({
  userId,
  size = WidthSizes.SIZE_640,
  children,
  ...paperProps
}: CoverPhotoV2Props) => {
  const { image: coverPhoto, shouldBlur } = useCoverPhoto({
    userId,
    size
  })

  return (
    <Paper
      backgroundColor='none'
      css={{
        backgroundImage: `url(${coverPhoto}), linear-gradient(
          180deg,
          rgba(0, 0, 0, 0.1) 50%,
          rgba(0, 0, 0, 0.3) 100%
        )`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundBlendMode: 'multiply, normal',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '100%',
          ...(shouldBlur ? { backdropFilter: 'blur(25px)' } : undefined)
        },
        overflow: 'hidden'
      }}
      {...paperProps}
    >
      {children}
    </Paper>
  )
}
