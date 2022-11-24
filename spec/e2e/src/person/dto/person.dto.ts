import { NodeKey, NotNull, Unique, Node } from '../../../../../lib';

@Node({ label: 'Person' })
export class PersonDto {
  @NodeKey({ additionalKeys: ['firstname'] })
  name: string;

  @NotNull()
  firstname: string;

  @NotNull()
  @Unique()
  surname: string;

  @NotNull()
  age: number;
}
