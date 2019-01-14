export interface EthereumResolver {
  resolve (contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives): Promise<any>
}
