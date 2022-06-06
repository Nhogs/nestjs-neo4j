import {
  ConstraintKey,
  ConstraintNotNull,
  ConstraintUnique,
  Node,
} from '../../../../lib';

@Node({ label: 'Person' })
export class PersonDto {
  @ConstraintUnique()
  @ConstraintNotNull()
  @ConstraintNotNull({ name: 'node_exists', ifNotExists: true })
  @ConstraintKey({
    name: 'node_key_with_config',
    additionalKeys: ['age'],
  })
  name: string;

  @ConstraintUnique({ name: 'uniqueness', additionalKeys: ['age'] })
  @ConstraintKey({
    additionalKeys: ['surname'],
  })
  @ConstraintKey({
    name: 'node_key',
  })
  firstname: string;

  surname: string;

  age: number;
}
