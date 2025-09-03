import { useEffect, useRef, useState } from 'react'

import { Flex, Paper } from '@audius/harmony'
import { useFormikContext } from 'formik'

import { AMOUNT_OF_STEPS, MAX_IMAGE_SIZE } from '../constants'

import { ArtistCoinsAnchoredSubmitRow } from './ArtistCoinsAnchoredSubmitRow'
import { CoinFormFields } from './CoinFormFields'
import { ImageUploadArea } from './ImageUploadArea'
import { StepHeader } from './StepHeader'
import type { SetupFormValues, SetupPageProps } from './types'

const messages = {
  stepInfo: `STEP 1 of ${AMOUNT_OF_STEPS}`,
  title: 'Set Up Your Coin',
  description:
    'This is your one and only coin. Its name, symbol, and image are permanent once launched, so choose carefully.'
}

export const SetupPage = ({ onContinue, onBack }: SetupPageProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const { handleSubmit, setFieldValue, values, errors, touched } =
    useFormikContext<SetupFormValues>()

  // Custom validation check to ensure all required fields are filled
  const isFormValid =
    values.coinName.trim() !== '' &&
    values.coinSymbol.trim() !== '' &&
    values.coinImage !== null

  const handleBack = () => {
    onBack?.()
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  // Clean up blob URL on unmount or when image changes
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])

  const handleContinue = () => {
    onContinue?.()
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
                onFileInputChange={(
                  event: React.ChangeEvent<HTMLInputElement>
                ) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    // Check file size (15MB limit)
                    if (file.size <= MAX_IMAGE_SIZE) {
                      setFieldValue('coinImage', file)
                      // Create blob URL for preview
                      const url = URL.createObjectURL(file)
                      setImageUrl(url)
                    } else {
                      // TODO: Show error message to user
                      // File size exceeds 15MB limit
                    }
                  }
                }}
                error={
                  touched.coinImage && errors.coinImage
                    ? errors.coinImage
                    : undefined
                }
              />
            </Flex>
          </form>
        </Paper>
      </Flex>
      <ArtistCoinsAnchoredSubmitRow
        onContinue={handleContinue}
        onBack={handleBack}
        isValid={isFormValid}
      />
    </>
  )
}
