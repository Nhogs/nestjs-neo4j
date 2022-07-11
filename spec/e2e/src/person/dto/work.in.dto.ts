import { NotNull, Relationship } from '../../../../../lib';

@Relationship({ type: 'WORK_IN' })
export class WorkInDto {
  @NotNull()
  since: Date;
}
