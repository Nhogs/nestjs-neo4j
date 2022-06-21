import {
  ConstraintKey,
  ConstraintNotNull,
  Integer,
  Node,
} from '../../../../lib';

@Node()
export class Cat {
  @ConstraintKey()
  readonly name: string;

  @ConstraintNotNull()
  readonly age: number;

  @ConstraintNotNull()
  readonly breed: string;

  @ConstraintNotNull()
  readonly created: Integer;
}
