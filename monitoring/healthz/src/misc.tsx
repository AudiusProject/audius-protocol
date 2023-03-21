export function HealthLink({ endpoint }: { endpoint?: string }) {
  if (!endpoint) return null
  const url = new URL(endpoint)
  return (
    <a href={endpoint + '/health_check'} target="_blank">
      {url.host}
    </a>
  )
}
