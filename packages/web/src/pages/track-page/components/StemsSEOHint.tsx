const keywords = ['sound', 'kit', 'sample', 'pack', 'stems', 'mix']

const StemsSEOHint = () => {
  return (
    <div style={{ display: 'none' }}>
      {keywords.map((k) => (
        <h2 key={k}>{k}</h2>
      ))}
    </div>
  )
}

export default StemsSEOHint
