export const createCypherConstraint = (
  name: string,
  ifNotExists: boolean,
  isRel: boolean,
  label: string,
  props: string[],
  constraintType: string,
) => {
  let query = 'CREATE CONSTRAINT';

  if (name) {
    query += ` \`${name}\``;
  }

  if (ifNotExists) {
    query += ` IF NOT EXISTS`;
  }

  query += ` FOR`;

  if (isRel) {
    query += ` ()-[p:\`${label}\`]-()`;
  } else {
    query += ` (p:\`${label}\`)`;
  }

  query += ` REQUIRE `;

  if (props.length > 1) {
    query += `(`;
  }

  query += props.map((p) => `p.\`` + p + `\``).join(`,`);

  if (props.length > 1) {
    query += ` )`;
  }
  query += ' ' + constraintType;
  return query;
};
