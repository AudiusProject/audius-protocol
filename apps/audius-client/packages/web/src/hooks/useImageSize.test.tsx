import { useMemo } from 'react'

import { DefaultSizes, SquareSizes } from '@audius/common'
import { render } from '@testing-library/react'

import { useImageSize } from 'common/hooks/useImageSize'

jest.mock('react-redux', () => ({
  useDispatch: () => () => {}
}))

const TestComponent = (
  props: Omit<Parameters<typeof useImageSize>[0], 'dispatch'>
) => {
  const dispatch = () => {}
  // @ts-ignore
  const image = useImageSize({ ...props, dispatch })
  return <div>{image ?? 'nothing'}</div>
}

describe('useImageSize', () => {
  describe('desired size is cached', () => {
    describe('if an override exists', () => {
      it('returns the override size', () => {
        const { getByText } = render(
          <TestComponent
            id={1}
            size={SquareSizes.SIZE_1000_BY_1000}
            sizes={{
              [SquareSizes.SIZE_1000_BY_1000]: 'large',
              [DefaultSizes.OVERRIDE]: 'override'
            }}
            action={() => {}}
          />
        )

        getByText('override')
      })

      describe('if the url is empty', () => {
        it('returns the default image', () => {
          const { getByText } = render(
            <TestComponent
              id={1}
              size={SquareSizes.SIZE_1000_BY_1000}
              sizes={{
                [SquareSizes.SIZE_1000_BY_1000]: 'large',
                [DefaultSizes.OVERRIDE]: ''
              }}
              action={() => {}}
              defaultImage='default'
            />
          )

          getByText('default')
        })
      })
    })
    describe('if no override exists', () => {
      it('returns the desired size', () => {
        const { getByText } = render(
          <TestComponent
            id={1}
            size={SquareSizes.SIZE_1000_BY_1000}
            sizes={{
              [SquareSizes.SIZE_1000_BY_1000]: 'large'
            }}
            action={() => {}}
          />
        )

        getByText('large')
      })

      describe('if the url is empty', () => {
        it('returns the default image', () => {
          const { getByText } = render(
            <TestComponent
              id={1}
              size={SquareSizes.SIZE_1000_BY_1000}
              sizes={{
                [SquareSizes.SIZE_1000_BY_1000]: ''
              }}
              action={() => {}}
              defaultImage='default'
            />
          )

          getByText('default')
        })
      })
    })
  })

  describe('desired size is not cached', () => {
    describe('if a larger size is cached', () => {
      const props = {
        id: 1,
        size: SquareSizes.SIZE_150_BY_150,
        sizes: {
          [SquareSizes.SIZE_480_BY_480]: 'medium',
          [SquareSizes.SIZE_1000_BY_1000]: 'large'
        },
        action: () => {}
      }

      it('returns the larger size', () => {
        const { getByText } = render(<TestComponent {...props} />)
        getByText('large')
      })

      it('does not dispatch the action to load the desired size', () => {
        const action = jest.fn()
        render(<TestComponent {...props} action={action} />)
        expect(action).not.toHaveBeenCalled()
      })
    })

    describe('if a smaller size is cached', () => {
      const props = {
        id: 1,
        size: SquareSizes.SIZE_1000_BY_1000,
        sizes: {
          [SquareSizes.SIZE_150_BY_150]: 'small',
          [SquareSizes.SIZE_480_BY_480]: 'medium'
        },
        action: () => {}
      }

      it('returns the smaller size', () => {
        const { getByText } = render(<TestComponent {...props} />)
        getByText('medium')
      })

      it('dispatches the action to load the desired size', () => {
        const action = jest.fn()
        render(<TestComponent {...props} action={action} />)
        expect(action).toHaveBeenCalledWith(1, SquareSizes.SIZE_1000_BY_1000)
      })
    })

    describe('if no sizes are cached', () => {
      const props = {
        id: 1,
        size: SquareSizes.SIZE_1000_BY_1000,
        sizes: {},
        action: () => {},
        defaultImage: 'default'
      }

      it('returns undefined', () => {
        const { getByText } = render(<TestComponent {...props} />)
        getByText('nothing')
      })

      it('dispatches the action to load the desired size', () => {
        const action = jest.fn()
        render(<TestComponent {...props} action={action} />)
        expect(action).toHaveBeenCalledWith(1, SquareSizes.SIZE_1000_BY_1000)
      })
    })

    describe('if load is disabled', () => {
      const props = {
        id: 1,
        size: SquareSizes.SIZE_1000_BY_1000,
        sizes: {},
        action: () => {},
        load: false
      }

      it('does not dispatch the action to load the desired size', () => {
        const action = jest.fn()
        render(<TestComponent {...props} action={action} />)
        expect(action).not.toHaveBeenCalled()
      })
    })
  })

  describe('if onDemand is enabled', () => {
    const OnDemandTestComponent = (props: {
      useImageOptions: Parameters<typeof useImageSize>[0]
      callFunction?: boolean
    }) => {
      const getImage = useImageSize(props.useImageOptions)

      const image = useMemo(() => {
        if (props.callFunction) {
          return getImage()
        }
      }, [getImage, props.callFunction])

      return <div>{image ?? 'nothing'}</div>
    }

    const props = {
      id: 1,
      size: SquareSizes.SIZE_1000_BY_1000,
      sizes: {},
      action: () => {},
      defaultImage: 'default',
      onDemand: true
    }

    it('does not dispatch the action if the returned function is not called', () => {
      const action = jest.fn()
      const dispatch = () => {}
      const { getByText } = render(
        <OnDemandTestComponent
          // @ts-ignore
          useImageOptions={{ ...props, dispatch, action }}
          callFunction={false}
        />
      )
      getByText('nothing')
      expect(action).not.toHaveBeenCalled()
    })

    it('dispatches the action if the returned function is not called', () => {
      const action = jest.fn()
      const dispatch = () => {}
      const { getByText } = render(
        <OnDemandTestComponent
          // @ts-ignore
          useImageOptions={{ ...props, dispatch, action }}
          callFunction={true}
        />
      )
      getByText('nothing')
      expect(action).toHaveBeenCalled()
    })
  })
})
