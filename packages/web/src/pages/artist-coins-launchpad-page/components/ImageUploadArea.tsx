import {
  Flex,
  Button,
  IconCloudUpload,
  Text,
  useTheme,
  Artwork
} from '@audius/harmony'

import { ALLOWED_IMAGE_FILE_TYPES } from 'utils/imageProcessingUtil'

import type { ImageUploadAreaProps } from './types'

const IMAGE_SIZE = 200

const messages = {
  dragDropText: 'Drag-and-drop an image (Max 15 MB)',
  selectFile: 'Select A File',
  selectAnother: 'Select Another Image'
}

export const ImageUploadArea = ({
  fileInputRef,
  coinImage,
  imageUrl,
  onFileSelect,
  onFileInputChange
}: ImageUploadAreaProps) => {
  const theme = useTheme()

  return (
    <>
      {/* Hidden file input */}
      <input
        type='file'
        ref={fileInputRef}
        onChange={onFileInputChange}
        accept={ALLOWED_IMAGE_FILE_TYPES.join(',')}
        style={{ display: 'none' }}
      />

      {coinImage && imageUrl ? (
        /* Selected State - Show hexagonal image */
        <Flex
          direction='column'
          alignItems='center'
          justifyContent='center'
          gap='l'
          p='xl'
          w='100%'
        >
          <Artwork
            src={imageUrl}
            hex
            w={IMAGE_SIZE}
            h={IMAGE_SIZE}
            borderWidth={0}
          />
          <Button
            variant='secondary'
            size='small'
            onClick={onFileSelect}
            type='button'
          >
            {messages.selectAnother}
          </Button>
        </Flex>
      ) : (
        /* Empty State - Show upload area */
        <Flex
          css={{
            border: `2px dashed ${theme.color.neutral.n150}`,
            borderRadius: theme.cornerRadius.m,
            background: theme.color.special.white,
            cursor: 'pointer',
            transition: `border-color ${theme.motion.hover}`,
            ':hover': {
              borderColor: theme.color.neutral.n800
            }
          }}
          onClick={onFileSelect}
          direction='column'
          alignItems='center'
          justifyContent='center'
          gap='l'
          p='xl'
          w='100%'
        >
          <Flex alignItems='center' gap='xs'>
            <IconCloudUpload color='default' />
            <Text variant='body' size='l' color='default'>
              {messages.dragDropText}
            </Text>
          </Flex>
          <Button
            variant='secondary'
            size='small'
            onClick={(e) => {
              e.stopPropagation()
              onFileSelect()
            }}
            type='button'
          >
            {messages.selectFile}
          </Button>
        </Flex>
      )}
    </>
  )
}
