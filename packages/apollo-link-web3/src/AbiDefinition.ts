export enum BaseType {
  uint256,
  bytes32
}

export enum AbiType {
  Function,
  Event
}

export interface AbiDefinition {
  getType(name: string): AbiType
}
