import neo4j from 'neo4j-driver';
import { INestApplication } from '@nestjs/common';
import { Neo4jModule, Neo4jService } from '../lib';
import { Test } from '@nestjs/testing';

describe('Verify Neo4j Connectivity', () => {
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
    await neo4jService.run(
      { cypher: 'MATCH (n) DETACH DELETE n' },
      {
        write: true,
      },
    );
  });

  it('should verify connectivity', async () => {
    expect(await neo4jService.verifyConnectivity()).toMatchInlineSnapshot(`
      Object {
        "address": "localhost:7687",
        "version": "Neo4j/4.4.8",
      }
    `);
  });

  it('should rxRun', (done) => {
    neo4jService
      .rxRun({ cypher: 'MATCH (n) RETURN count(n) AS count' })
      .records()
      .subscribe({
        next: (record) => {
          expect(record.get('count')).toMatchInlineSnapshot(`
          Integer {
            "high": 0,
            "low": 0,
          }
          `);
        },
        complete: () => {
          done();
        },
      });
  });

  afterAll(async () => {
    return await app.close();
  });
});
