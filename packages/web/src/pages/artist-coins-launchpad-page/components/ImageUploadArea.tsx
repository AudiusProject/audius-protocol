import {
  Flex,
  Button,
  IconCloudUpload,
  Text,
  useTheme,
  Artwork
} from '@audius/harmony'

import { ALLOWED_IMAGE_FILE_TYPES } from 'utils/imageProcessingUtil'
import zIndex from 'utils/zIndex'

type ImageUploadAreaProps = {
  fileInputRef: React.RefObject<HTMLInputElement>
  coinImage: File | null
  imageUrl: string | null
  onFileSelect: () => void
  onFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  isProcessing?: boolean
}

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
  onFileInputChange,
  error,
  isProcessing = false
}: ImageUploadAreaProps) => {
  const theme = useTheme()

  const borderContainerStyles = {
    border: `1px dashed ${theme.color.border.default}`,
    borderRadius: theme.cornerRadius.m,
    background: theme.color.special.white,
    cursor: isProcessing ? 'default' : 'pointer',
    transition: `border-color ${theme.motion.hover}`,
    ':hover': {
      borderColor: isProcessing
        ? theme.color.border.default
        : theme.color.border.strong
    }
  }

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
          css={borderContainerStyles}
        >
          <Artwork
            src={imageUrl}
            hex
            w={IMAGE_SIZE}
            h={IMAGE_SIZE}
            borderWidth={0}
            isLoading={isProcessing}
            css={{ position: 'relative', zIndex: zIndex.SVG_BUTTON_ICONS }}
          />
          <Button
            variant='secondary'
            size='small'
            onClick={onFileSelect}
            type='button'
            disabled={isProcessing}
          >
            {messages.selectAnother}
          </Button>
        </Flex>
      ) : (
        /* Empty State or Processing State - Show upload area or processing skeleton */
        <Flex
          css={borderContainerStyles}
          onClick={isProcessing ? undefined : onFileSelect}
          direction='column'
          alignItems='center'
          justifyContent='center'
          gap='l'
          p='xl'
          w='100%'
        >
          {isProcessing ? (
            <Artwork
              hex
              w={IMAGE_SIZE}
              h={IMAGE_SIZE}
              borderWidth={0}
              isLoading={true}
              css={{ position: 'relative', zIndex: zIndex.SVG_BUTTON_ICONS }}
            />
          ) : (
            <>
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
            </>
          )}
        </Flex>
      )}
      {error && (
        <Text color='danger' size='s' variant='body'>
          {error}
        </Text>
      )}
    </>
  )
}
