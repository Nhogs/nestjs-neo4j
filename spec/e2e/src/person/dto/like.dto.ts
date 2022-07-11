import { NotNull, Relationship } from '../../../../../lib';

@Relationship({ type: 'LIKE' })
export class LikeDto {
  @NotNull()
  when: string;
  @NotNull()
  since: string;
}
