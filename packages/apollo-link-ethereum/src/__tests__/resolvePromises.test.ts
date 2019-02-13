import { resolvePromises } from '../resolvePromises'

describe('resolvePromises', () => {
  it('should return null for results without errors', () => {
    const input = {
      success: {
        result: 'hello',
        promise: Promise.resolve()
      },
      foo: 'bar',
      test: [1, 2, 3],
      error: {
        result: 'testing',
        promise: Promise.resolve()
      }
    }

    expect(resolvePromises(input)).toEqual(null)
  })

  it('should replace promise structures with values', () => {

    const input = {
      success: {
        result: 'hello',
        promise: Promise.resolve()
      },
      foo: 'bar',
      test: [1, 2, 3],
      error: {
        error: 'This did not work',
        promise: Promise.reject()
      }
    }

    var errors = resolvePromises(input)

    expect(errors).toEqual([
      'This did not work'
    ])

    expect(input).toEqual({
      success: 'hello',
      foo: 'bar',
      test: [1, 2, 3],
      error: undefined
    })
  })
})
