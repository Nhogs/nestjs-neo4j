import {
  ConstraintKey,
  ConstraintNotNull,
  ConstraintUnique,
  Node,
} from '../../../../lib';

@Node({ label: 'Person' })
export class PersonDto {
  @ConstraintUnique({ ifNotExists: false, useCommonName: false })
  @ConstraintNotNull({ ifNotExists: false, useCommonName: false })
  @ConstraintNotNull({ name: 'node_exists', ifNotExists: true })
  @ConstraintKey({
    name: 'node_key_with_config',
    ifNotExists: false,
    additionalKeys: ['age'],
  })
  name: string;

  @ConstraintUnique({
    name: 'uniqueness',
    additionalKeys: ['age'],
    ifNotExists: false,
  })
  @ConstraintKey({
    additionalKeys: ['surname'],
    ifNotExists: false,
    useCommonName: false,
  })
  @ConstraintKey({
    name: 'node_key',
    ifNotExists: false,
  })
  firstname: string;

  @ConstraintUnique({ ifNotExists: false, useCommonName: true })
  @ConstraintNotNull({ ifNotExists: false, useCommonName: true })
  surname: string;

  age: number;
}
