import { AbiDefinition } from './AbiDefinition'

export interface AbiMapping {
  getAbi(name: string): AbiDefinition;
}
