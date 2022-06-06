import { ConstraintNotNull, Relationship } from '../../../../lib';

@Relationship({ name: 'LIKED' })
export class LikedDto {
  @ConstraintNotNull()
  when: string;
  @ConstraintNotNull({ name: 'relationship_exists' })
  since: string;
}
