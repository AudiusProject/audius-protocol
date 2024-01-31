import { useEffect, useState } from 'react'
import Select from 'react-select'
import { useQuery } from '@tanstack/react-query'
import { useEnvironmentSelection } from '../components/EnvironmentSelector'
import { SP, useServiceProviders } from '../useServiceProviders'

export function UptimeMatrix() {
  const [env, nodeType] = useEnvironmentSelection()
  const { data: sps } = useServiceProviders(env, nodeType, true)
  const [selectedSps, setSelectedSps] = useState<SP[]>([])
  const [hoverRow, setHoverRow] = useState(-1)

  // Map host -> (otherHost -> true/false if otherHost says host is up/down)
  const [nodeHealthStatus, setNodeHealthStatus] = useState<Record<string, Record<string, boolean>>>({})

  useEffect(() => {
    if (sps && sps.length > 1) {
      setSelectedSps([sps[0], sps[1]])
    }
  }, [sps])

  const selectOptions = sps?.map(sp => ({ value: sp.endpoint, label: sp.endpoint })) ?? []

  const handleFilterChange = (selectedOptions: any) => {
    const selectedEndpoints = selectedOptions.map((option: any) => option.value)
    const newSelectedSps = sps?.filter(sp => selectedEndpoints.includes(sp.endpoint)) || []
    setSelectedSps(newSelectedSps)
  }

  const hosts = selectedSps.map(sp => sp.endpoint)
  const hostSortKey = (host: string) => new URL(host).hostname.split('.').reverse().join('.')
  hosts.sort((a, b) => (hostSortKey(a) < hostSortKey(b) ? -1 : 1))

  return (
    <div>
      <br />
      <Select
        defaultValue={selectOptions}
        isMulti
        name="nodes"
        options={selectOptions}
        className="basic-multi-select"
        classNamePrefix="select"
        value={selectedSps.map(sp => ({ value: sp.endpoint, label: sp.endpoint }))}
        onChange={handleFilterChange}
      />

      <br />

      <div className="px-4 py-2 text-center text-lg font-medium text-gray-700 dark:text-gray-300">Read as, "Does column think row was up in the past hour?"</div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
              </th>
              {hosts.map((host) => (
                <th
                  key={host}
                  className="px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {host.replace('https://', '')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800">
            {hosts.map((host, hostIdx) => (
              <tr key={host}
                  onMouseEnter={() => setHoverRow(hostIdx)}
                  onMouseLeave={() => setHoverRow(-1)}
                  className={`${hoverRow === hostIdx ? 'bg-yellow-100 dark:bg-yellow-900' : ''}`}>
                <td className="px-4 py-2">
                  {host.replace('https://', '')}
                </td>
                {hosts.map((other) => (
                  <td
                    key={other}
                    className="px-4 py-2 text-center"
                    title={`${other.replace('https://', '')}/d_api/uptime?host=${host}`}
                  >
                    <a href={`${other}/d_api/uptime?host=${host}&durationHours=1`} target="_blank" rel="noopener noreferrer">
                      {nodeHealthStatus[host] === undefined ? '⏳' : ''}
                      {nodeHealthStatus[host] !== undefined && (nodeHealthStatus[host][other] ? '✅' : '❌')}
                    </a>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSps.map(sp => (
        <SPHealthStatus key={sp.endpoint} sp={sp} sps={selectedSps} setNodeHealthStatus={setNodeHealthStatus} />
      ))}
    </div>
  )
}

type SPHealthStatusProps = {
  sp: SP
  sps: SP[]
  setNodeHealthStatus: React.Dispatch<React.SetStateAction<Record<string, Record<string, boolean>>>>
}
const SPHealthStatus = ({ sp, sps, setNodeHealthStatus }: SPHealthStatusProps) => {
  const fetchNodeHealthStatus = async () => {
    const healthStatusForOthers: Record<string, boolean> = {}
    // Query every other host to ask what it says about this host's uptime
    for (const otherSp of sps) {
      try {
        const response = await fetch(`${otherSp.endpoint}/d_api/uptime?host=${sp.endpoint}&durationHours=1`)
        const data = await response.json()
        const uptimeDate = Object.keys(data.uptime_raw_data)[0]
        healthStatusForOthers[otherSp.endpoint] = data.uptime_raw_data[uptimeDate] === 1
      } catch (e) {
        console.error(`Error fetching uptime for ${sp.endpoint} from ${otherSp.endpoint}:`, e)
        healthStatusForOthers[otherSp.endpoint] = false
      }
    }
    // Map host -> (otherHost -> true/false if otherHost says host is up/down)
    return { [sp.endpoint]: healthStatusForOthers }
  }

  useQuery(['nodeHealthStatus', sp.endpoint, sps.map(sp => sp.endpoint).join(',')], fetchNodeHealthStatus, {
    onSuccess: (data) => {
      setNodeHealthStatus(prevStatus => ({ ...prevStatus, ...data }))
    },

    // There's a lot of data to fetch as we query every other host for every host, so don't refetch
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

  return null
}
