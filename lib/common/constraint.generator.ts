const start = (name: string, ifNotExists: boolean) =>
  `CREATE CONSTRAINT${name ? ` \`${name}\`` : ''}${
    ifNotExists ? ` IF NOT EXISTS` : ''
  } FOR`;

const target = (isRel: boolean, label: string) =>
  isRel ? ` ()-[p:\`${label}\`]-()` : ` (p:\`${label}\`)`;

const properties = (props: string[]) =>
  `${props.length > 1 ? `(` : ``}${props
    .map((p) => `p.\`` + p + `\``)
    .join(`, `)}${props.length > 1 ? `)` : ``}`;

export const createCypherConstraint = (
  name: string,
  ifNotExists: boolean,
  isRel: boolean,
  label: string,
  props: string[],
  constraintType: string,
) => {
  return `${start(name, ifNotExists)}${target(
    isRel,
    label,
  )} REQUIRE ${properties(props)} ${constraintType}`;
};

export const generateExplicitName = (
  name: string,
  property: string,
  constraintType: string,
): string => {
  let type: string = '';

  if (constraintType === 'IS NODE KEY') {
    type = 'key';
  }
  if (constraintType === 'IS UNIQUE') {
    type = 'unique';
  }
  if (constraintType === 'IS NOT NULL') {
    type = 'exists';
  }

  return `${name.toLowerCase()}_${property.toLowerCase()}_${type}`;
};
