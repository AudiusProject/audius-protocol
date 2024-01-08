import { expect, test } from 'vitest'
import { testRouter } from './_test_helpers'

test('version', async () => {
  // user 101
  {
    const caller = await testRouter(101)
    const plays = await caller.me.playHistory({})

    expect(plays).length(3)
    expect(plays.map((r) => r.trackId)).toEqual([201, 202, 203])

    expect(plays[0].repostCount).toEqual(1)
    expect(plays[1].repostCount).toEqual(0)

    // offset
    {
      const plays = await caller.me.playHistory({
        cursor: 1,
      })
      expect(plays).length(2)
      expect(plays[0].trackId).toEqual(202)
    }

    // sort
    {
      // track_name asc
      let rows = await caller.me.playHistory({
        sort: 'trackName',
        sortAscending: true,
      })

      const names = rows.map((row) => row.trackName)
      expect(names).toEqual(names.sort())

      // track_name desc
      rows = await caller.me.playHistory({
        sort: 'trackName',
        sortAscending: false,
      })
      expect(rows.map((r) => r.trackName)).toEqual(names.sort().reverse())

      // play_date asc
      rows = await caller.me.playHistory({
        sortAscending: true,
      })
      expect(rows.map((r) => r.trackId)).toEqual([203, 202, 201])

      // try all the sorts to ensure no exceptions
      for (const sort of [
        'trackName',
        'artistName',
        'releaseDate',
        'playDate',
        'duration',
        'playCount',
        'repostCount',
      ]) {
        await caller.me.playHistory({
          sort: sort as any,
        })
      }
    }
  }

  // user 102
  {
    const caller = await testRouter(102)
    const plays = await caller.me.playHistory({})
    expect(plays).length(0)
  }
})
