import {
  neo4jSkipLimit,
  NODE,
  ORDER_BY,
  SKIP_LIMIT,
  TIMESTAMP,
} from '../../../lib';

describe('Query Generator', () => {
  it('should NODE ())', async () => {
    expect(NODE()).toMatchInlineSnapshot(`"()"`);
  });

  it('should NODE (n)', async () => {
    expect(NODE('n')).toMatchInlineSnapshot(`"(\`n\`)"`);
  });

  it('should NODE (n:Person)', async () => {
    expect(NODE('n', 'Person')).toMatchInlineSnapshot(`"(\`n\`:\`Person\`)"`);
  });

  it('should NODE with props', async () => {
    const props = { firstName: 'John', lastName: 'Snow' };
    expect(NODE('m', 'Movie', { props })).toMatchInlineSnapshot(
      `"(\`m\`:\`Movie\` {\`firstName\`: $\`props\`.\`firstName\`, \`lastName\`: $\`props\`.\`lastName\`})"`,
    );
  });

  it('should TIMESTAMP(n)', async () => {
    expect(TIMESTAMP('n')).toMatchInlineSnapshot(`""`);
  });

  it('should TIMESTAMP(n, created)', async () => {
    expect(TIMESTAMP('n', 'created')).toMatchInlineSnapshot(
      `"\`n\`.\`created\` = timestamp()"`,
    );
  });

  it('should TIMESTAMP(n, created, SET)', async () => {
    expect(TIMESTAMP('n', 'created', ' SET ')).toMatchInlineSnapshot(
      `" SET \`n\`.\`created\` = timestamp()"`,
    );
  });

  it('should ORDER_BY(n)', async () => {
    expect(ORDER_BY('n')).toMatchInlineSnapshot(`""`);
  });

  it('should ORDER_BY(n, name)', async () => {
    expect(ORDER_BY('n', 'name')).toMatchInlineSnapshot(
      `" ORDER BY \`n\`.\`name\`"`,
    );
  });

  it('should ORDER_BY(n, name, true)', async () => {
    expect(ORDER_BY('n', 'name', true)).toMatchInlineSnapshot(
      `" ORDER BY \`n\`.\`name\` DESC"`,
    );
  });

  it('should SKIP_LIMIT()', async () => {
    expect(SKIP_LIMIT()).toMatchInlineSnapshot(`""`);
  });

  it('should SKIP_LIMIT({})', async () => {
    expect(SKIP_LIMIT({})).toMatchInlineSnapshot(`""`);
  });

  it('should SKIP_LIMIT({skip})', async () => {
    expect(SKIP_LIMIT({ skip: 10 })).toMatchInlineSnapshot(`" SKIP $skip"`);
  });

  it('should SKIP_LIMIT({limit})', async () => {
    expect(SKIP_LIMIT({ limit: 100 })).toMatchInlineSnapshot(`" LIMIT $limit"`);
  });

  it('should SKIP_LIMIT({skip, limit})', async () => {
    expect(SKIP_LIMIT({ skip: 0, limit: 100 })).toMatchInlineSnapshot(
      `" SKIP $skip LIMIT $limit"`,
    );
  });

  it('should neo4jSkipLimit()', async () => {
    expect(neo4jSkipLimit()).toMatchInlineSnapshot(`Object {}`);
  });

  it('should neo4jSkipLimit({})', async () => {
    expect(neo4jSkipLimit({})).toMatchInlineSnapshot(`Object {}`);
  });

  it('should SKIP_LIMIT({ skip: 0 })', async () => {
    expect(neo4jSkipLimit({ skip: 0 })).toMatchInlineSnapshot(`
      Object {
        "skip": Integer {
          "high": 0,
          "low": 0,
        },
      }
    `);
  });

  it('should SKIP_LIMIT({ limit: 100 })', async () => {
    expect(neo4jSkipLimit({ limit: 100 })).toMatchInlineSnapshot(`
      Object {
        "limit": Integer {
          "high": 0,
          "low": 100,
        },
      }
    `);
  });

  it('should SKIP_LIMIT({ skip: 0, limit: 10 })', async () => {
    expect(neo4jSkipLimit({ skip: 0, limit: 10 })).toMatchInlineSnapshot(`
      Object {
        "limit": Integer {
          "high": 0,
          "low": 10,
        },
        "skip": Integer {
          "high": 0,
          "low": 0,
        },
      }
    `);
  });
});
