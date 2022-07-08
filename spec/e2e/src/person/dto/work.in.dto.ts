import { ConstraintNotNull, Relationship } from '../../../../../lib';

@Relationship({ name: 'WORK_IN' })
export class WorkInDto {
  @ConstraintNotNull()
  since: Date;
}
