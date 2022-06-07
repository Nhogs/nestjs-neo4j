import { Node, ConstraintKey } from '../../../../lib';

@Node()
export class Cat {
  @ConstraintKey({ ifNotExists: true, useCommonName: true })
  readonly name: string;
  readonly age: number;
  readonly breed: string;
}
