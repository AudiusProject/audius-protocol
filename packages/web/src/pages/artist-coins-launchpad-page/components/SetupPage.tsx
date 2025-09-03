import { useEffect, useRef, useState } from 'react'

import { Flex, Paper } from '@audius/harmony'
import { useFormik } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { AMOUNT_OF_STEPS, MAX_IMAGE_SIZE } from '../constants'
import { setupFormSchema } from '../validation'

import { ArtistCoinsAnchoredSubmitRow } from './ArtistCoinsAnchoredSubmitRow'
import { CoinFormFields } from './CoinFormFields'
import { ImageUploadArea } from './ImageUploadArea'
import { StepHeader } from './StepHeader'
import type { SetupPageProps } from './types'

const messages = {
  stepInfo: `STEP 1 of ${AMOUNT_OF_STEPS}`,
  title: 'Set Up Your Coin',
  description:
    'This is your one and only coin. Its name, symbol, and image are permanent once launched, so choose carefully.'
}

export const SetupPage = ({ onContinue, onBack }: SetupPageProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const formik = useFormik({
    initialValues: {
      coinName: '',
      coinSymbol: '',
      coinImage: null as File | null
    },
    validationSchema: toFormikValidationSchema(setupFormSchema),
    onSubmit: (_values) => {
      // TODO: Implement coin creation logic with values
      onContinue?.()
    }
  })

  const handleBack = () => {
    onBack?.()
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (15MB limit)
      if (file.size <= MAX_IMAGE_SIZE) {
        formik.setFieldValue('coinImage', file)
        // Create blob URL for preview
        const url = URL.createObjectURL(file)
        setImageUrl(url)
      } else {
        // TODO: Show error message to user
        // File size exceeds 15MB limit
      }
    }
  }

  // Clean up blob URL on unmount or when image changes
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])

  const handleCreate = () => {
    formik.handleSubmit()
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

          <form onSubmit={formik.handleSubmit}>
            <Flex direction='column' gap='xl'>
              <CoinFormFields
                values={formik.values}
                errors={formik.errors}
                touched={formik.touched}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />

              <ImageUploadArea
                fileInputRef={fileInputRef}
                coinImage={formik.values.coinImage}
                imageUrl={imageUrl}
                onFileSelect={handleFileSelect}
                onFileInputChange={handleFileInputChange}
              />
            </Flex>
          </form>
        </Paper>
      </Flex>
      <ArtistCoinsAnchoredSubmitRow
        onCreate={handleCreate}
        onBack={handleBack}
      />
    </>
  )
}
