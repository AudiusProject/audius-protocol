import { useImageSize as useImageSizeCommon } from 'audius-client/src/common/hooks/useImageSize'
import {
  ImageSizesObject,
  SquareSizes,
  WidthSizes
} from 'audius-client/src/common/models/ImageSizes'
import { Maybe, Nullable } from 'audius-client/src/common/utils/typeUtils'
import { Image, ImageSourcePropType } from 'react-native'
import { useDispatch } from 'react-redux'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'

type UseImageSizeOptions = Parameters<typeof useImageSizeCommon>[0]

/**
 * Helper function to create a useImageSize hook for a given action and defaultImageSource
 */
export const getUseImageSizeHook = <Sizes extends SquareSizes | WidthSizes>({
  action,
  defaultImageSource
}: {
  action: UseImageSizeOptions['action']
  defaultImageSource: ImageSourcePropType
}) => {
  return (
    args: Omit<
      UseImageSizeOptions,
      'action' | 'dispatch' | 'defaultImage' | 'sizes' | 'size'
    > & {
      sizes: Nullable<ImageSizesObject<Sizes>>
      size: Sizes
    }
  ) => {
    const dispatch = useDispatchWeb() as typeof useDispatch

    // This resolves a statically imported image into a uri
    const defaultImage = Image.resolveAssetSource(defaultImageSource).uri

    return useImageSizeCommon({
      ...args,
      action,
      dispatch,
      defaultImage
    }) as Maybe<string>
  }
}
