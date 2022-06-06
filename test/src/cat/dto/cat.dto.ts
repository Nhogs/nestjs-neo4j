import { Node } from '../../../../lib';

@Node()
export class CatDto {
  readonly name: string;
  readonly age: number;
  readonly breed: string;
}
