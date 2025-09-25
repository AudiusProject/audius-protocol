import { useRef, useState } from 'react'

import { Flex, Paper } from '@audius/harmony'
import { useFormikContext } from 'formik'

import { useFormImageUrl } from 'hooks/useFormImageUrl'
import {
  resizeImage,
  ALLOWED_IMAGE_FILE_TYPES
} from 'utils/imageProcessingUtil'

import { ArtistCoinsSubmitRow } from '../components/ArtistCoinsSubmitRow'
import { CoinFormFields } from '../components/CoinFormFields'
import { ImageUploadArea } from '../components/ImageUploadArea'
import { StepHeader } from '../components/StepHeader'
import type { SetupFormValues, PhasePageProps } from '../components/types'
import { AMOUNT_OF_STEPS, MAX_IMAGE_SIZE } from '../constants'

const messages = {
  stepInfo: `STEP 1 of ${AMOUNT_OF_STEPS}`,
  title: 'Set Up Your Coin',
  description:
    'This is your one and only coin. Its name, symbol, and image are permanent once launched, so choose carefully.',
  errors: {
    invalidFileType: 'Please select a JPEG, PNG, or WebP image file',
    fileTooLarge: 'File size must be less than 15MB',
    processingError: 'Unable to process this file. Please try another image.'
  }
}

export const SetupPage = ({ onContinue, onBack }: PhasePageProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const { handleSubmit, setFieldValue, values, errors, touched } =
    useFormikContext<SetupFormValues>()

  const imageUrl = useFormImageUrl(values.coinImage)

  const handleBack = () => {
    onBack?.()
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleContinue = () => {
    onContinue?.()
  }

  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  const handleDropAccepted = async (files: File[]) => {
    const file = files[0]
    if (file) {
      await processFile(file)
    }
  }

  const handleDropRejected = (files: File[]) => {
    const file = files[0]
    if (file) {
      if (!ALLOWED_IMAGE_FILE_TYPES.includes(file.type)) {
        setImageError(messages.errors.invalidFileType)
      } else if (file.size > MAX_IMAGE_SIZE) {
        setImageError(messages.errors.fileTooLarge)
      } else {
        setImageError(messages.errors.processingError)
      }
    }
  }

  const processFile = async (file: File) => {
    // Clear any previous errors
    setImageError(null)

    // Check file type
    if (!ALLOWED_IMAGE_FILE_TYPES.includes(file.type)) {
      setImageError(messages.errors.invalidFileType)
      return
    }

    // Check file size (15MB limit)
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError(messages.errors.fileTooLarge)
      return
    }

    setIsProcessingImage(true)
    try {
      // Process the image with resizeImage (converts to JPEG, resizes to 1000x1000)
      const processedFile = await resizeImage(file, 1000, true)
      setFieldValue('coinImage', processedFile)
      // Hook will automatically create blob URL from processed file
    } catch (error) {
      console.error('Error processing image:', error)
      setImageError(messages.errors.processingError)
    } finally {
      setIsProcessingImage(false)
    }
  }

  return (
    <>
      <Flex
        direction='column'
        alignItems='center'
        justifyContent='center'
        gap='l'
        pb='unit20'
      >
        <Paper p='2xl' gap='2xl' direction='column' w='100%'>
          <StepHeader
            stepInfo={messages.stepInfo}
            title={messages.title}
            description={messages.description}
          />

          <form onSubmit={handleSubmit}>
            <Flex direction='column' gap='xl'>
              <CoinFormFields />

              <ImageUploadArea
                fileInputRef={fileInputRef}
                coinImage={values.coinImage}
                imageUrl={imageUrl}
                onFileSelect={handleFileSelect}
                onFileInputChange={handleFileInputChange}
                onDropAccepted={handleDropAccepted}
                onDropRejected={handleDropRejected}
                error={
                  imageError ??
                  (touched.coinImage && errors.coinImage
                    ? errors.coinImage
                    : undefined)
                }
                isProcessing={isProcessingImage}
              />
            </Flex>
          </form>
        </Paper>
      </Flex>
      <ArtistCoinsSubmitRow
        onContinue={handleContinue}
        onBack={handleBack}
        isValid={!errors.coinName && !errors.coinSymbol && !errors.coinImage}
      />
    </>
  )
}
