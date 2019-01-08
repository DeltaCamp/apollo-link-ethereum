export interface Web3Resolver {
  resolve (contractName, contractDirectives, fieldName, args, info): Promise<any>
}
