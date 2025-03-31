import type { ImageSourcePropType } from 'react-native'

/**
 * Converts our primitive URL strings or imports into ImageSourcePropType.
 *
 * In many places, we expect a URL string, but fallback to an imported image.
 * Those imported images in React Native are _numbers_ and are meant to be
 * used directly as an ImageSource, but the strings need to be wrapped in an
 * object under the `uri` key. Also, ImageSourcePropType can't be null, so this
 * handles that too.
 */
export const primitiveToImageSource = (
  src: string | number | undefined | null
): ImageSourcePropType | undefined =>
  typeof src === 'string' ? { uri: src } : (src ?? undefined)
