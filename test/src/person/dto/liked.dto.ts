import { ConstraintNotNull, Relationship } from '../../../../lib';

@Relationship({ name: 'LIKED' })
export class LikedDto {
  @ConstraintNotNull({ ifNotExists: false, useCommonName: false })
  when: string;
  @ConstraintNotNull({ name: 'relationship_exists', ifNotExists: false })
  since: string;
}
