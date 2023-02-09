import { classNames } from '../../util'

export type HealthyRow = {
  fileName: string
  nodeLinks: { href: string; display: string }[]
  md5: string
  job: { href: string; display: string }
  highlight: boolean
}

export default function HealthyRow({ row }: { row: HealthyRow }) {
  return (
    <tr
      key={row.fileName}
      className={classNames(
        row.highlight ? 'bg-amber-50' : '',
        'divide-x divide-gray-200',
      )}
    >
      <td className="whitespace-nowrap py-4 pl-4 pr-4 text-sm text-gray-500 sm:pr-6">
        {row.fileName}
      </td>
      <td className="whitespace-nowrap py-4 pl-4 pr-4 text-sm text-gray-500 sm:pr-6">
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
      <td className="whitespace-nowrap py-4 pl-4 pr-4 text-sm text-gray-500 sm:pr-6">
        {row.md5}
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
