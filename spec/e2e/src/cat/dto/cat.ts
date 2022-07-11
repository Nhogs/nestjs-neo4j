import { Node, NodeKey, NotNull } from '../../../../../lib';

@Node()
export class Cat {
  @NodeKey()
  name: string;

  @NotNull()
  age: number;

  @NotNull()
  breed: string;

  @NotNull()
  created: string;
}
