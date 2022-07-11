import { Neo4jService } from "../../../lib";
import { createNeo4jTestApp, Neo4jTestApp } from "../../helpers";

describe('Neo4jService', () => {
  let app: Neo4jTestApp;

  beforeAll(async () => {
    app = await createNeo4jTestApp();
  });

  beforeEach(async () => {
    await app.cleanDb();
  });

  it('should verifyConnectivity', async () => {
    expect(await app.neo4jService.verifyConnectivity()).toMatchInlineSnapshot(`
      Object {
        "address": "localhost:7687",
        "version": "Neo4j/4.4.8",
      }
    `);
  });

  it('should getSession', async () => {
    const session = await app.neo4jService.getSession();
    expect(session).toBeDefined();
    return await session.close();
  });

  it('should getRxSession', () => {
    const session = app.neo4jService.getRxSession();
    expect(session).toBeDefined();
    session.close();
  });

  it('should run', async () => {
    const queryResult = await app.neo4jService.run(
      {
        cypher: 'CREATE (n) SET n=$p RETURN properties(n) AS node',
        parameters: { p: { msg: 'hello' } },
      },
      { write: true },
    );
    expect(queryResult.records.map((r) => r.get('node')))
      .toMatchInlineSnapshot(`
      Array [
        Object {
          "msg": "hello",
        },
      ]
    `);
  });

  it('should rxRun', (done) => {
    app.neo4jService
      .rxRun(
        {
          cypher: 'CREATE (n) SET n=$p RETURN properties(n) AS node',
          parameters: { p: { msg: 'hello rx' } },
        },
        { write: true },
      )
      .records()
      .subscribe({
        next: (record) => {
          expect(record.get('node')).toMatchInlineSnapshot(`
          Object {
            "msg": "hello rx",
          }
          `);
        },
        complete: () => {
          done();
        },
      });
  });

  afterAll(async () => {
    return await app.cleanClose();
  });
});
