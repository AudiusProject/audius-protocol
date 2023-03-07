import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useLogs } from '../api'
import DateTimePicker from '../components/dateTimePicker/DateTimePicker'
import type { TimelineItem } from '../components/timeline'
import Timeline from '../components/timeline'

// TODO: Add collapsibles for details for each event
// TODO: Add select dropdowns to filter by node
// TODO: Make time hoverable to show UTC

export default function History() {
  const [searchParams] = useSearchParams()
  const [numEntries, setNumEntries] = useState('100')
  const [numHoursAgo, setNumHoursAgo] = useState(0.1)
  const [selectedDate, setSelectedDate] = useState(dayjs().subtract(numHoursAgo, 'hour'))
  const [showDateTimePicker, setShowDateTimePicker] = useState(false)
  const [timelineItems, setTimelineItems] = useState([] as TimelineItem[])
  const logQueries = useLogs(numEntries?.length ? parseInt(numEntries) : 1, numHoursAgo)
  const logErrors = logQueries.filter((query) => query.error)

  // Update numEntries and numHoursAgo whenever searchParams change (only once on page load)
  useEffect(() => {
    for (const [key, val] of searchParams.entries()) {
      if (key === 'numEntries') {
        const newNumEntries = val
        if (newNumEntries !== numEntries) setNumEntries(newNumEntries)
      } else if (key === 'since') {
        const sinceDate = dayjs(val)
        if (sinceDate.isValid()) {
          setNumHoursAgo(dayjs().diff(sinceDate, 'hour'))
        }
      }
    }
  }, [searchParams])

  // Update timeline whenever the logs change - all or nothing to avoid showing a timeline that's only partially accurate
  useEffectAllDepsChange(() => {
    // Don't show any timeline items if any log query is loading or else the timeline will be incomplete
    if (logQueries.filter((query) => query.isLoading).length) return

    const newTimeline: TimelineItem[] = []

    // Add all statusUpdate logs
    if (logQueries[0].data) {
      for (const statusUpdateLog of logQueries[0].data) {
        newTimeline.push({
          datetime: dayjs(statusUpdateLog.lastOk),
          content: `${statusUpdateLog.host} OK (shards: ${statusUpdateLog.shards.join(
            ', ',
          )})`,
          icon: <SignalIcon />,
          iconBg: 'bg-purple-400',
        })
      }
    }

    // Add all updateHealthyNodeSet logs
    if (logQueries[1].data) {
      for (const updateHealthyNodeSetLog of logQueries[1].data) {
        newTimeline.push({
          datetime: dayjs(updateHealthyNodeSetLog.timestamp),
          content: `New set of healthy nodes: ${updateHealthyNodeSetLog.healthyNodes.join(
            ', ',
          )} broadcasted by ${updateHealthyNodeSetLog.updatedBy}`,
          icon: <MegaphoneIcon />,
          iconBg: 'bg-yellow-500',
        })
      }
    }

    // Add all rebalance logs
    if (logQueries[2].data) {
      for (const { host, events } of logQueries[2].data.starts) {
        for (const startEvent of events) {
          newTimeline.push({
            datetime: dayjs(startEvent.timestamp),
            content: `${host} started rebalancing`,
            icon: <ScaleOutlineIcon />,
            iconBg: 'bg-green-400',
          })
        }
      }

      for (const { host, events } of logQueries[2].data.starts) {
        for (const endEvent of events) {
          newTimeline.push({
            datetime: dayjs(endEvent.timestamp),
            content: `${host} finished rebalancing`,
            icon: <ScaleIcon />,
            iconBg: 'bg-green-600',
          })
        }
      }
    }

    // Sort timeline by datetime and truncate to numEntries
    setTimelineItems(
      [...newTimeline]
        .sort((a, b) => (a.datetime.isBefore(b.datetime) ? 1 : -1))
        .filter((_, i) => i < (numEntries?.length ? parseInt(numEntries) : 1)),
    )
  }, [logQueries[0].data, logQueries[1].data, logQueries[2].data])

  // Recalculate numHoursAgo when date changes
  useEffect(() => {
    setNumHoursAgo(dayjs().diff(selectedDate.second(0).millisecond(0), 'hour', true))
  }, [selectedDate])

  return (
    <>
      <div className="flex w-full justify-center text-center dark:text-white">
        <span className="mx-2 flex items-center">Show</span>
        <label htmlFor="numEntries" className="sr-only">
          Number of events
        </label>
        <div>
          <input
            type="number"
            name="numEntries"
            id="numEntries"
            className="block w-20 rounded-lg border border-gray-300 bg-gray-50 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:ring-purple-500  dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-purple-500 dark:focus:ring-purple-500"
            value={numEntries}
            onChange={(e) => {
              if (e.target.value?.length) {
                const parsed = parseInt(e.target.value)
                setNumEntries(parsed > 0 ? parsed + '' : '')
              } else setNumEntries('')
              setSelectedDate(dayjs().subtract(numHoursAgo, 'hour'))
            }}
          />
        </div>
        <span className="mx-2 flex items-center">events starting at</span>
        <DateTimePicker
          onChange={(selectedDate: dayjs.Dayjs) => setSelectedDate(selectedDate)}
          show={showDateTimePicker}
          setShow={(show) => setShowDateTimePicker(show)}
          defaultDate={selectedDate}
        />
      </div>
      <br />
      {logErrors.length > 0 && (
        <div className="dark:text-white">Encountered error(s) while fetching:</div>
      )}
      {logErrors.length > 0 &&
        logErrors.map(({ error }, i) => (
          <div key={i} className="dark:text-white">
            {JSON.stringify(error)}
          </div>
        ))}
      {logQueries.filter((query) => query.isLoading).length > 0 && (
        <div className="dark:text-white">Loading...</div>
      )}
      <br />
      <Timeline items={timelineItems} />
    </>
  )
}

function SignalIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5 text-white"
    >
      <path
        fillRule="evenodd"
        d="M5.636 4.575a.75.75 0 010 1.06 9 9 0 000 12.729.75.75 0 01-1.06 1.06c-4.101-4.1-4.101-10.748 0-14.849a.75.75 0 011.06 0zm12.728 0a.75.75 0 011.06 0c4.101 4.1 4.101 10.749 0 14.85a.75.75 0 11-1.06-1.061 9 9 0 000-12.728.75.75 0 010-1.06zM7.757 6.696a.75.75 0 010 1.061 6 6 0 000 8.485.75.75 0 01-1.06 1.061 7.5 7.5 0 010-10.607.75.75 0 011.06 0zm8.486 0a.75.75 0 011.06 0 7.5 7.5 0 010 10.607.75.75 0 01-1.06-1.06 6 6 0 000-8.486.75.75 0 010-1.06zM9.879 8.818a.75.75 0 010 1.06 3 3 0 000 4.243.75.75 0 11-1.061 1.06 4.5 4.5 0 010-6.363.75.75 0 011.06 0zm4.242 0a.75.75 0 011.061 0 4.5 4.5 0 010 6.364.75.75 0 01-1.06-1.06 3 3 0 000-4.244.75.75 0 010-1.06zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function MegaphoneIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5 text-white"
    >
      <path d="M16.881 4.346A23.112 23.112 0 018.25 6H7.5a5.25 5.25 0 00-.88 10.427 21.593 21.593 0 001.378 3.94c.464 1.004 1.674 1.32 2.582.796l.657-.379c.88-.508 1.165-1.592.772-2.468a17.116 17.116 0 01-.628-1.607c1.918.258 3.76.75 5.5 1.446A21.727 21.727 0 0018 11.25c0-2.413-.393-4.735-1.119-6.904zM18.26 3.74a23.22 23.22 0 011.24 7.51 23.22 23.22 0 01-1.24 7.51c-.055.161-.111.322-.17.482a.75.75 0 101.409.516 24.555 24.555 0 001.415-6.43 2.992 2.992 0 00.836-2.078c0-.806-.319-1.54-.836-2.078a24.65 24.65 0 00-1.415-6.43.75.75 0 10-1.409.516c.059.16.116.321.17.483z" />
    </svg>
  )
}

function ScaleOutlineIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5 text-white"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z"
      />
    </svg>
  )
}

function ScaleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5 text-white"
    >
      <path
        fillRule="evenodd"
        d="M12 2.25a.75.75 0 01.75.75v.756a49.106 49.106 0 019.152 1 .75.75 0 01-.152 1.485h-1.918l2.474 10.124a.75.75 0 01-.375.84A6.723 6.723 0 0118.75 18a6.723 6.723 0 01-3.181-.795.75.75 0 01-.375-.84l2.474-10.124H12.75v13.28c1.293.076 2.534.343 3.697.776a.75.75 0 01-.262 1.453h-8.37a.75.75 0 01-.262-1.453c1.162-.433 2.404-.7 3.697-.775V6.24H6.332l2.474 10.124a.75.75 0 01-.375.84A6.723 6.723 0 015.25 18a6.723 6.723 0 01-3.181-.795.75.75 0 01-.375-.84L4.168 6.241H2.25a.75.75 0 01-.152-1.485 49.105 49.105 0 019.152-1V3a.75.75 0 01.75-.75zm4.878 13.543l1.872-7.662 1.872 7.662h-3.744zm-9.756 0L5.25 8.131l-1.872 7.662h3.744z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function useEffectAllDepsChange(fn: any, deps: any) {
  const [changeTarget, setChangeTarget] = useState(deps)

  useEffect(() => {
    setChangeTarget((prev: any) => {
      if (prev.every((dep: any, i: number) => dep !== deps[i])) {
        return deps
      }

      return prev
    })
  }, [deps])

  useEffect(fn, changeTarget)
}
