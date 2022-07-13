import { Logger } from '@nestjs/common';
import { Neo4jModelService, Neo4jService } from '../../../lib';
import { createNeo4jTestApp, Neo4jTestApp } from '../../helpers';
import { int } from 'neo4j-driver';

class NodeFixture {
  name: string;
}

class NodeWithTimestampFixture {
  name: string;
  created: Date;
}

class Neo4jModelServiceFixture<T> extends Neo4jModelService<T> {
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
  let serviceFixture: Neo4jModelServiceFixture<NodeFixture>;
  let serviceFixtureWithTimestamp: Neo4jModelServiceFixture<NodeWithTimestampFixture>;

  beforeAll(async () => {
    app = await createNeo4jTestApp();

    serviceFixture = new Neo4jModelServiceFixture<NodeFixture>(
      app.neo4jService,
      'withoutTimestamp',
      undefined,
      undefined,
    );

    serviceFixtureWithTimestamp =
      new Neo4jModelServiceFixture<NodeWithTimestampFixture>(
        app.neo4jService,
        'NodeWithTimestamp',
        undefined,
        'created',
      );
  });

  beforeEach(async () => {
    await app.cleanDb();
  });

  it('should toNeo4j', async () => {
    expect(serviceFixture.toNeo4j({ name: 'myNode' })).toMatchInlineSnapshot(`
      Object {
        "name": "myNode",
      }
    `);
  });

  it('should fromNeo4j', async () => {
    expect(serviceFixture.fromNeo4j({ name: 'myNode' })).toMatchInlineSnapshot(`
      Object {
        "name": "myNode",
      }
    `);
  });

  it('should toNeo4j timestamp X', async () => {
    expect(
      serviceFixtureWithTimestamp.toNeo4j({
        name: 'myNode',
      }),
    ).toMatchInlineSnapshot(`
      Object {
        "name": "myNode",
      }
    `);
  });

  it('should fromNeo4j timestamp X', async () => {
    expect(
      serviceFixtureWithTimestamp.fromNeo4j({
        name: 'myNode',
      }),
    ).toMatchInlineSnapshot(`
      Object {
        "name": "myNode",
      }
    `);
  });

  it('should toNeo4j timestamp', async () => {
    expect(
      serviceFixtureWithTimestamp.toNeo4j({
        name: 'myNode',
        created: new Date(1657455914905),
      }),
    ).toMatchInlineSnapshot(`
      Object {
        "created": Integer {
          "high": 385,
          "low": -401461351,
        },
        "name": "myNode",
      }
    `);
  });

  it('should fromNeo4j timestamp', async () => {
    expect(
      serviceFixtureWithTimestamp.fromNeo4j({
        name: 'myNode',
        created: int(1657455914905),
      }),
    ).toMatchInlineSnapshot(`
      Object {
        "created": 2022-07-10T12:25:14.905Z,
        "name": "myNode",
      }
    `);
  });

  it('should toNeo4j/fromNeo4j', async () => {
    const props = {
      name: 'myNode',
      created: new Date(1657455914905),
    };

    expect(
      serviceFixtureWithTimestamp.fromNeo4j(
        serviceFixtureWithTimestamp.toNeo4j(props),
      ),
    ).toEqual(props);
  });

  it('should runCypherConstraints without constraints', async () => {
    expect(await serviceFixture.runCypherConstraints()).toMatchInlineSnapshot(
      `Array []`,
    );
  });

  afterAll(async () => {
    return await app.cleanClose();
  });
});
