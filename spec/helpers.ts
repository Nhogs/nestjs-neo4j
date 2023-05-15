import { Neo4jConfig, Neo4jModule, Neo4jService } from '../lib';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

export async function cleanDb(neo4jService: Neo4jService) {
  await neo4jService.run(
    { cypher: 'MATCH (n) DETACH DELETE n' },
    {
      write: true,
    },
  );
}

export async function createNeo4jTestingModule(customConfig?: Partial<Neo4jConfig>) {
  const config: Neo4jConfig = {
    scheme: 'neo4j',
    host: 'localhost',
    port: '7687',
    database: 'neo4j',
    username: 'neo4j',
    password: 'test_password',
  };

  return Test.createTestingModule({
    imports: [
      Neo4jModule.forRoot(
        customConfig ? { ...config, ...customConfig } : config,
      ),
    ],
  }).compile();
}

export type Neo4jTestApp = {
  app: INestApplication;
  neo4jService: Neo4jService;
  cleanDb: () => Promise<void>;
  cleanClose: () => Promise<void>;
};

export async function createNeo4jTestApp(customConfig?: Partial<Neo4jConfig>): Promise<Neo4jTestApp> {
  const testingModule = await createNeo4jTestingModule(customConfig);
  const app = testingModule.createNestApplication();
  await app.init();
  const neo4jService = app.get<Neo4jService>(Neo4jService);

  return {
    app,
    neo4jService,
    cleanDb: () => cleanDb(neo4jService),
    cleanClose: async () => {
      await cleanDb(neo4jService);
      return app.close();
    },
  };
}
