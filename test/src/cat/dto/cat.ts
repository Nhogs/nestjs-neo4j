import { Node, ConstraintKey } from '../../../../lib';

@Node()
export class Cat {
  @ConstraintKey({ name: 'name_is_unique', ifNotExists: true })
  readonly name: string;
  readonly age: number;
  readonly breed: string;
}
