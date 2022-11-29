import { useState } from 'react'
import { decodeId, encodeId } from './AudiusSurvivalKit'

const inputStyle = {
  fontSize: 18,
  padding: 10,
}

export function IdTranslator() {
  const [id, setId] = useState('')
  const [enc, setEnc] = useState('')

  function updateId(val: string) {
    setId(val)
    setEnc(encodeId(val))
  }

  function updateEnc(val: string) {
    setEnc(val)
    setId(decodeId(val).toString())
  }

  return (
    <div style={{ margin: 50 }}>
      <div>
        <h3>Integer</h3>
        <input
          style={inputStyle}
          type="text"
          value={id}
          onChange={(e) => updateId(e.target.value)}
        />
      </div>
      <div>
        <h3>Encoded</h3>
        <input
          style={inputStyle}
          type="text"
          value={enc}
          onChange={(e) => updateEnc(e.target.value)}
        />
      </div>
    </div>
  )
}
