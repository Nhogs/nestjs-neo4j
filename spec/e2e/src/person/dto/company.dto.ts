import { NodeKey, Node } from '../../../../../lib';

@Node({ label: 'Company' })
export class CompanyDto {
  @NodeKey()
  name: string;
}
