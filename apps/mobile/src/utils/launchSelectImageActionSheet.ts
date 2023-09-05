import { ActionSheetIOS, Alert, Platform } from 'react-native'
import type { ImageLibraryOptions, Asset } from 'react-native-image-picker'
import { launchImageLibrary, launchCamera } from 'react-native-image-picker'

import type { Image } from 'app/types/image'

const photoOptions: ImageLibraryOptions = {
  includeBase64: true,
  maxWidth: 1440,
  mediaType: 'photo',
  quality: 0.9
}

export const launchSelectImageActionSheet = (
  callback: (image: Image, rawResponse: Asset) => void,
  shareSheetTintColor: string
) => {
  const handlePhoto = ({ assets }: { assets: Asset[] | undefined }) => {
    const response = assets?.[0]
    const selectedPhoto = !!response?.base64

    if (selectedPhoto) {
      const image = {
        height: response.height ?? 0,
        width: response.width ?? 0,
        name: response.fileName ?? response.uri?.split('/').pop() ?? '',
        size: response.fileSize ?? 0,
        fileType: response.type ?? '',
        url: response.uri ?? '',
        file: `data:${response.type};base64,${response.base64}`,
        type: 'base64' as const
      }
      callback(image, response)
    }
  }

  const selectPhotoFromLibrary = () => {
    launchImageLibrary(
      {
        ...photoOptions,
        selectionLimit: 1
      },
      handlePhoto
    )
  }

  const takePhoto = () => {
    launchCamera(
      {
        ...photoOptions,
        saveToPhotos: true
      },
      handlePhoto
    )
  }

  if (Platform.OS === 'ios') {
    // iOS ActionSheet
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Photo Library', 'Take Photo'],
        tintColor: shareSheetTintColor,
        cancelButtonIndex: 0
      },
      (buttonIndex) => {
        if (buttonIndex === 1) {
          selectPhotoFromLibrary()
        } else if (buttonIndex === 2) {
          takePhoto()
        }
      }
    )
  } else {
    // Android Alert
    Alert.alert(
      'Profile Photo',
      '',
      [
        {
          text: 'Photo Library',
          style: 'default',
          onPress: () => selectPhotoFromLibrary()
        },
        {
          text: 'Take Photo',
          style: 'default',
          onPress: () => takePhoto()
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ],
      {
        cancelable: true,
        onDismiss: () => null
      }
    )
  }
}
