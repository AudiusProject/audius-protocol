import { useEffect, useLayoutEffect, useRef } from 'react'

import { useAsyncStorage as useAsyncStorageBase } from '@react-native-async-storage/async-storage'
import { useAsyncFn, usePrevious } from 'react-use'

type Options = {
  serializer?: (value: any) => string
  deserializer?: (value: string) => any
}

export const useAsyncStorage = (
  key: string,
  defaultValue?: any,
  options: Options = {}
) => {
  const { serializer = JSON.stringify, deserializer = JSON.parse } = options
  const defaultValueRef = useRef(defaultValue)
  const { getItem, setItem, removeItem } = useAsyncStorageBase(key)

  const [{ value, loading }, getValue] = useAsyncFn(async () => {
    const item = await getItem()
    if (item) return deserializer(item)
  })
  const wasLoading = usePrevious(loading)

  const [, setValue] = useAsyncFn(async (value: any) => {
    if (value) {
      await setItem(serializer(value))
      await getValue()
    }
  })

  const [, remove] = useAsyncFn(async () => {
    await removeItem()
    await getValue()
  })

  useLayoutEffect(() => {
    getValue()
  }, [getValue])

  useEffect(() => {
    if (wasLoading && !loading && !value) {
      setValue(defaultValueRef.current)
    }
  }, [wasLoading, loading, value, setValue])

  return [value, setValue, remove]
}
