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

  it('should verify connectivity', async () => {
    expect(await neo4jService.verifyConnectivity()).toMatchInlineSnapshot(`
      Object {
        "address": "localhost:7687",
        "version": "Neo4j/4.4.8",
      }
    `);
  });

  afterAll(async () => {
    return await app.close();
  });
});
