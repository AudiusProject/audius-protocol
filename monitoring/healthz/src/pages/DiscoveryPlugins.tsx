import useSWR from 'swr'
import { JsonToTable } from 'react-json-to-table'
import { SP } from '../useServiceProviders'
import { useEnvironmentSelection } from '../components/EnvironmentSelector'
import { useServiceProviders } from '../useServiceProviders'

const convertBooleansToStrings = (obj: any) => {
  const res = { ...obj }
  for (const key in obj) {
    if (typeof obj[key] === 'boolean') {
      res[key] = obj[key].toString()
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      res[key] = convertBooleansToStrings(obj[key])
    }
  }
  return res
}

export function DiscoveryPlugins() {
  const [env] = useEnvironmentSelection()
  const { data: sps, error } = useServiceProviders(env, 'discovery')
  if (error) return <div className="text-red-600">error</div>
  if (!sps) return null
  return (
    <div className="p-5 bg-white dark:bg-gray-800">
      <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">Plugins</h2>
      <div className="overflow-x-auto">
        <table className="table-auto w-full border-collapse border dark:border-gray-700">
          <tbody>
            {sps.map((sp) => (
              <PluginRow key={sp.endpoint} sp={sp} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then(convertBooleansToStrings)

function PluginRow({ sp }: { sp: SP }) {
  const { data, error } = useSWR(sp.endpoint + '/plugins', fetcher)

  if (!data || error || data.error) return null

  return (
    <tr className="hover:bg-gray-100 dark:hover:bg-gray-700">
      <td className="p-2 border dark:border-gray-700">
        <a href={`${sp.endpoint}/health_check`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline dark:text-blue-300">
          {sp.endpoint.replace('https://', '')}
        </a>
      </td>
      <td className="p-2 border dark:border-gray-700 whitespace-nowrap text-black dark:text-white">
        <JsonToTable json={data} />
      </td>
    </tr>
  )
}
