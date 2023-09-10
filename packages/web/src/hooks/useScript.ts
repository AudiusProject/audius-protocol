import { useEffect, useState } from 'react'

export const useScript = (src: string, isModule = false) => {
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    const alreadyLoaded = [...document.getElementsByTagName('script')].find(
      (script) => script.src === src
    )
    if (alreadyLoaded) {
      setScriptLoaded(true)
    } else {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      if (isModule) {
        script.type = 'module'
      }
      script.onload = () => setScriptLoaded(true)
      document.body.appendChild(script)
    }
  }, [src, isModule])

  return scriptLoaded
}
