import neo4j, { Integer } from 'neo4j-driver';

export function NODE(
  n?: string,
  lbl?: string,
  props?: Record<string, Record<string, any>>,
) {
  const r = props
    ? Object.keys(props)
        .map((v) =>
          Object.keys(props[v])
            .map((k) => `\`${k}\`: $\`${v}\`.\`${k}\``)
            .join(`, `),
        )
        .join(`, `)
    : '';

  return `(${n ? `\`${n}\`` : ``}${lbl ? `:\`${lbl}\`` : ''}${
    props ? ` {${r}}` : ``
  })`;
}

export function RETURN_PROPERTIES(n: string, alias: string) {
  return ` RETURN properties(\`${n}\`) AS \`${alias}\``;
}

export function TIMESTAMP(n: string, prop?: string, prefix?: string) {
  return prop
    ? `${prefix ? prefix : ''}\`${n}\`.\`${prop}\` = timestamp()`
    : '';
}

export function ORDER_BY(n: string, p?: string, desc?: boolean) {
  return `${p ? ` ORDER BY \`${n}\`.\`${p}\`${desc ? ' DESC' : ''}` : ``}`;
}

export function SKIP_LIMIT(p?: { skip?; limit? }) {
  return `${!isNaN(p?.skip) ? ` SKIP $skip` : ``}${
    !isNaN(p?.limit) ? ` LIMIT $limit` : ``
  }`;
}

export function neo4jSkipLimit(p?: { skip?: number; limit?: number }) {
  let res: { skip?: Integer; limit?: Integer } = {};

  if (!isNaN(p?.skip)) {
    res.skip = neo4j.int(p?.skip);
  }
  if (!isNaN(p?.limit)) {
    res.limit = neo4j.int(p?.limit);
  }
  return res;
}
