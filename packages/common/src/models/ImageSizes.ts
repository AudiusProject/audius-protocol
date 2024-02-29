export enum DefaultSizes {
  // Used as a catch-all fallback when no other size data is available.
  OVERRIDE = 'OVERRIDE'
}

export enum SquareSizes {
  SIZE_150_BY_150 = '150x150',
  SIZE_480_BY_480 = '480x480',
  SIZE_1000_BY_1000 = '1000x1000'
}

export enum WidthSizes {
  SIZE_640 = '640x',
  SIZE_2000 = '2000x'
}

export type URL = string

export type ImageSizesObjectWithoutOverride<
  ImageSizeEnum extends SquareSizes | WidthSizes
> = Partial<Record<ImageSizeEnum, URL>>

export type ImageSizesObject<ImageSizeEnum extends SquareSizes | WidthSizes> =
  ImageSizesObjectWithoutOverride<ImageSizeEnum> &
    Partial<Record<DefaultSizes, URL | number>>

export type CoverArtSizesCids = ImageSizesObjectWithoutOverride<SquareSizes>
export type CoverArtSizes = ImageSizesObject<SquareSizes>
export type ProfilePictureSizesCids =
  ImageSizesObjectWithoutOverride<SquareSizes>
export type ProfilePictureSizes = ImageSizesObject<SquareSizes>
export type CoverPhotoSizesCids = ImageSizesObjectWithoutOverride<WidthSizes>
export type CoverPhotoSizes = ImageSizesObject<WidthSizes>
