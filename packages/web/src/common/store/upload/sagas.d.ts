// eslint-disable-next-line
export declare function* handleUploads(config: {
  tracks: any[]
  isCollection: boolean
  isStem?: boolean
  isAlbum?: boolean
})

export default function sagas(): (() => Generator<
  ForkEffect<never>,
  void,
  unknown
>)[]
