import { execute } from 'apollo-link'
import gql from 'graphql-tag'

const sampleQuery = gql`
  query SampleQuery {
    stub {
      id
    }
  }
`

describe('ContractLink', () => {
  describe('tests', () => {
    it('should work', done => {
      const observable = execute(link, {
        query: sampleQuery,
      });
      observable.subscribe({
        next,
        error: error => expect(false),
        complete: () => {
          expect(next).toHaveBeenCalledTimes(1);
          done();
        },
      });
    })
  })
})
