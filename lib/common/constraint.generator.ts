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
