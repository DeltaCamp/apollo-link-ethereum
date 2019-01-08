import { resolvePromises } from '../resolvePromises'

describe('resolvePromises', () => {
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
        promise: Promise.resolve()
      }
    }

    resolvePromises(input)

    expect(input).toEqual({
      success: 'hello',
      foo: 'bar',
      test: [1, 2, 3],
      error: {
        error: 'This did not work'
      }
    })
  })
})
