import { Logger } from '@nestjs/common';
import { Neo4jModelService, Neo4jService } from '../../../lib';
import { createNeo4jTestApp, Neo4jTestApp } from '../../helpers';
import { Neo4jNodeModelService } from "../../../lib";

class NodeFixture {
  name: string;
}

class NodeWithTimestampFixture {
  name: string;
  created: Date;
}

class Neo4jNodeModelServiceFixture<T> extends Neo4jNodeModelService<T> {
  constructor(
    protected readonly neo4jService: Neo4jService,
    readonly label: string,
    protected readonly logger: Logger | undefined,
    protected readonly timestamp: string | undefined,
  ) {
    super();
  }
}

describe('Neo4jModelService', () => {
  let app: Neo4jTestApp;
  let serviceFixture: Neo4jNodeModelServiceFixture<NodeFixture>;
  let serviceFixtureWithTimestamp: Neo4jNodeModelServiceFixture<NodeWithTimestampFixture>;

  beforeAll(async () => {
    app = await createNeo4jTestApp();

    serviceFixture = new Neo4jNodeModelServiceFixture<NodeFixture>(
      app.neo4jService,
      'withoutTimestamp',
      undefined,
      undefined,
    );

    serviceFixtureWithTimestamp =
      new Neo4jNodeModelServiceFixture<NodeWithTimestampFixture>(
        app.neo4jService,
        'NodeWithTimestamp',
        undefined,
        'created',
      );
  });

  beforeEach(async () => {
    await app.cleanDb();
  });

  it('should create', async () => {
    expect(serviceFixture.create({ name: 'name' }).query)
      .toMatchInlineSnapshot(`
      {
        "cypher": "CREATE (\`n\`:\`withoutTimestamp\`) SET n=$props RETURN properties(\`n\`) AS \`created\`",
        "parameters": {
          "props": {
            "name": "name",
          },
        },
      }
    `);
  });

  it('should create with timestamp', async () => {
    expect(serviceFixtureWithTimestamp.create({ name: 'name' }).query)
      .toMatchInlineSnapshot(`
      {
        "cypher": "CREATE (\`n\`:\`NodeWithTimestamp\`) SET n=$props, \`n\`.\`created\` = timestamp() RETURN properties(\`n\`) AS \`created\`",
        "parameters": {
          "props": {
            "name": "name",
          },
        },
      }
    `);
  });

  afterAll(async () => {
    return await app.cleanClose();
  });
});
