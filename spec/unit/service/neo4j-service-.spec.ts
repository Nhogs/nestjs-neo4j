import neo4j from 'neo4j-driver';
import { INestApplication } from '@nestjs/common';
import { Neo4jModule, Neo4jService } from '../../../lib';
import { Test } from '@nestjs/testing';

async function cleanDb(neo4jService: Neo4jService) {
  await neo4jService.run(
    { cypher: 'MATCH (n) DETACH DELETE n' },
    {
      write: true,
    },
  );
}

describe('Neo4jService', () => {
  let app: INestApplication;
  let neo4jService: Neo4jService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        Neo4jModule.forRoot({
          scheme: 'neo4j',
          host: 'localhost',
          port: '7687',
          database: 'neo4j',
          username: 'neo4j',
          password: 'test',
        }),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    neo4jService = app.get<Neo4jService>(Neo4jService);
  });

  beforeEach(async () => {
    await cleanDb(neo4jService);
  });

  it('should verifyConnectivity', async () => {
    expect(await neo4jService.verifyConnectivity()).toMatchInlineSnapshot(`
      Object {
        "address": "localhost:7687",
        "version": "Neo4j/4.4.8",
      }
    `);
  });

  it('should getSession', async () => {
    const session = await neo4jService.getSession();
    expect(session).toBeDefined();
    return await session.close();
  });

  it('should getRxSession', () => {
    const session = neo4jService.getRxSession();
    expect(session).toBeDefined();
    session.close();
  });

  it('should run', async () => {
    const queryResult = await neo4jService.run(
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
    neo4jService
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
    await cleanDb(neo4jService);
    return await app.close();
  });
});
