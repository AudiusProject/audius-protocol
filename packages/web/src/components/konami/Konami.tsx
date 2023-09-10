import { useEffect } from 'react'

import { useKonami } from 'hooks/useKonami'

const Konami = () => {
  const { isKonami } = useKonami()
  useEffect(() => {
    if (isKonami) {
      const style = document.createElement('style')
      style.innerHTML = 'div, button { border: 1px solid gray; }'
      document.head.appendChild(style)
    }
  }, [isKonami])
  return null
}

export default Konami
