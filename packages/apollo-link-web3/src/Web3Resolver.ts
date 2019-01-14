export interface Web3Resolver {
  resolve (contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives): Promise<any>
}
