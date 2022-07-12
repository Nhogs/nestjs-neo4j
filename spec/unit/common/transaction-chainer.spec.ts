import { createNeo4jTestApp, Neo4jTestApp } from '../../helpers';
import { TransactionChainer } from '../../../lib';

describe('TransactionChainer', () => {
  let app: Neo4jTestApp;

  beforeAll(async () => {
    app = await createNeo4jTestApp();
  });

  beforeEach(async () => {
    await app.cleanDb();
  });

  it('should chain transaction', (done) => {
    const session = app.neo4jService.getSession({ write: true });
    const t = new TransactionChainer(session, session.beginTransaction());

    t.run({ cypher: 'CREATE (n:F)' })
      .run({ cypher: 'CREATE (n:T)' })
      .run({ cypher: 'MATCH (f:F),(t:T) CREATE (f)-[:LINKED_TO]->(t)' })
      .commit()
      .then(async () => {
        expect(
          (
            await app.neo4jService.run({
              cypher: 'MATCH (f)-[r:LINKED_TO]->(t) RETURN count(r) as count',
            })
          ).records[0].get('count'),
        ).toMatchInlineSnapshot(`
          Integer {
            "high": 0,
            "low": 1,
          }
        `);
      })
      .finally(() => {
        t.close();
        done();
      });
  });

  afterAll(async () => {
    return await app.cleanClose();
  });
});
