export interface EthereumResolver {
  async resolve (contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives): Promise<any>
}
