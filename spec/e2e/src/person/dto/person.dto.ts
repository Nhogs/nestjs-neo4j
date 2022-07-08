import {
  ConstraintKey,
  ConstraintNotNull,
  ConstraintUnique,
  Node,
} from '../../../../../lib';

@Node({ label: 'Person' })
export class PersonDto {
  @ConstraintKey({ additionalKeys: ['firstname'] })
  name: string;

  @ConstraintNotNull()
  firstname: string;

  @ConstraintNotNull()
  @ConstraintUnique()
  surname: string;

  @ConstraintNotNull()
  age: number;
}
