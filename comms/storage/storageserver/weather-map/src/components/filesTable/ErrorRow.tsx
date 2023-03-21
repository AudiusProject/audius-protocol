import type { EndpointToMd5 } from '../../api'
import { classNames, shortenUrl } from '../../util'

export type ErrorRow = {
  fileName: string
  nodeLinks: { href: string; display: string }[]
  md5s: EndpointToMd5
  job: { href: string; display: string }
  error: 'NOT_REPLICATED' | 'MD5_MISMATCH'
  highlight: boolean
}

export default function ErrorRow({ row }: { row: ErrorRow }) {
  return (
    <tr key={row.fileName} className="divide-x divide-gray-200">
      <td
        className={classNames(
          row.highlight ? 'bg-blend-hard-light' : '',
          'whitespace-nowrap py-4 pl-4 pr-4 text-sm text-gray-500 sm:pr-6',
        )}
      >
        {row.fileName}
      </td>
      <td
        className={classNames(
          row.error === 'NOT_REPLICATED' ? 'bg-red-50' : '',
          'whitespace-nowrap py-4 pl-4 pr-4 text-sm text-gray-500 sm:pr-6',
        )}
      >
        {row.nodeLinks.map(({ href, display }) => (
          <p key={display} className="mt-3 text-sm md:mt-0">
            <a
              target="_blank"
              href={href}
              className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600"
              rel="noreferrer"
            >
              {display}
              <span aria-hidden="true"> &rarr;</span>
            </a>
          </p>
        ))}
      </td>
      <td
        className={classNames(
          row.error === 'MD5_MISMATCH' ? 'bg-red-50' : '',
          'whitespace-nowrap py-4 pl-4 pr-4 text-sm text-gray-500 sm:pr-6',
        )}
      >
        {Object.keys(row.md5s).map((node) => (
          <div key={node}>
            {row.md5s[node]} ({shortenUrl(node)})
          </div>
        ))}
      </td>
      <td className="whitespace-nowrap py-4 pl-4 pr-4 text-sm text-gray-500 sm:pr-6">
        <a
          target="_blank"
          href={row.job.href}
          className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600"
          rel="noreferrer"
        >
          {row.job.display}
          <span aria-hidden="true"> &rarr;</span>
        </a>
      </td>
    </tr>
  )
}
