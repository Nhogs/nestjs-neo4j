import { ConstraintKey, Node } from '../../../../../lib';

@Node({ label: 'Company' })
export class CompanyDto {
  @ConstraintKey()
  name: string;
}
