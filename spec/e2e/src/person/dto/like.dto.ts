import { ConstraintNotNull, Relationship } from '../../../../../lib';

@Relationship({ name: 'LIKE' })
export class LikeDto {
  @ConstraintNotNull()
  when: string;
  @ConstraintNotNull()
  since: string;
}
