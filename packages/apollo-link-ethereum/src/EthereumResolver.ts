import { Observable, FetchResult } from 'apollo-link'

export interface EthereumResolver {
  resolve (contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives): Promise<any>,
  subscribe (contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives): Observable<FetchResult>
}
