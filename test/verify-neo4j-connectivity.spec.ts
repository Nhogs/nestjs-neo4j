import neo4j, { Driver } from 'neo4j-driver';

describe('Verify Neo4j Connectivity', () => {
  let driver: Driver;

  beforeAll(async () => {
    driver = neo4j.driver(
      `neo4j://localhost:7687`,
      neo4j.auth.basic('neo4j', 'test'),
    );
  });

  afterAll(async () => {
    await driver.close();
  });

  it('should verify connectivity', async () => {
    expect(await driver.verifyConnectivity()).toMatchInlineSnapshot(`
      Object {
        "address": "localhost:7687",
        "version": "Neo4j/4.4.7",
      }
    `);
  });
});
