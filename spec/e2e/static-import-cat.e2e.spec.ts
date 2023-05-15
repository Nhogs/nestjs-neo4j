import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './src/app.module';
import { Neo4jService } from '../../lib';
import { CatsService } from './src/cat/cats.service';
import { AppDisableLosslessIntegersModule } from './src/app-disable-lossless-Integers.module';
import { CatsDisableLosslessIntegersService } from './src/cat/cats-disable-lossless-integers.service';

async function cleanDb(neo4jService: Neo4jService) {
  await neo4jService.run(
    { cypher: 'MATCH (n) DETACH DELETE n' },
    {
      write: true,
    },
  );
}

describe('Cats E2e', () => {
  let app: INestApplication;
  let neo4jService: Neo4jService;
  let catsService: CatsService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    neo4jService = app.get<Neo4jService>(Neo4jService);
    catsService = app.get<CatsService>(CatsService);
  });

  beforeEach(async () => {
    await cleanDb(neo4jService);
  });

  it(`should runCypherConstraints`, async () => {
    return expect(await catsService.runCypherConstraints())
      .toMatchInlineSnapshot(`
              [
                "CREATE CONSTRAINT \`cat_name_key\` IF NOT EXISTS FOR (p:\`Cat\`) REQUIRE p.\`name\` IS NODE KEY",
                "CREATE CONSTRAINT \`cat_age_exists\` IF NOT EXISTS FOR (p:\`Cat\`) REQUIRE p.\`age\` IS NOT NULL",
                "CREATE CONSTRAINT \`cat_breed_exists\` IF NOT EXISTS FOR (p:\`Cat\`) REQUIRE p.\`breed\` IS NOT NULL",
                "CREATE CONSTRAINT \`cat_created_exists\` IF NOT EXISTS FOR (p:\`Cat\`) REQUIRE p.\`created\` IS NOT NULL",
              ]
            `);
  });

  it(`should create Cat query`, async () => {
    expect(
      catsService.create({
        name: 'Gypsy',
        age: 5,
        breed: 'Maine Coon',
      }).query,
    ).toMatchInlineSnapshot(`
      {
        "cypher": "CREATE (\`n\`:\`Cat\`) SET n=$props, \`n\`.\`created\` = timestamp() RETURN properties(\`n\`) AS \`created\`",
        "parameters": {
          "props": {
            "age": Integer {
              "high": 0,
              "low": 5,
            },
            "breed": "Maine Coon",
            "name": "Gypsy",
          },
        },
      }
    `);
  });

  it(`should create Cat`, async () => {
    expect(
      await catsService
        .create({
          name: 'Gypsy',
          age: 5,
          breed: 'Maine Coon',
        })
        .run(),
    ).toMatchInlineSnapshot(
      {
        created: expect.any(Date),
      },
      `
      {
        "age": 5,
        "breed": "Maine Coon",
        "created": Any<Date>,
        "name": "Gypsy",
      }
    `,
    );

    return expect({
      cats: await catsService.findAll().run(),
    }).toMatchInlineSnapshot(
      {
        cats: [
          {
            created: expect.any(Date),
          },
        ],
      },
      `
                      {
                        "cats": [
                          {
                            "age": 5,
                            "breed": "Maine Coon",
                            "created": Any<Date>,
                            "name": "Gypsy",
                          },
                        ],
                      }
                  `,
    );
  });

  it(`should update Cat query`, async () => {
    expect(catsService.update({ name: 'Gypsy' }, { name: 'Curly' }).query)
      .toMatchInlineSnapshot(`
      {
        "cypher": "MATCH (\`n\`:\`Cat\` {\`name\`: $\`props\`.\`name\`}) SET n += $updates RETURN properties(\`n\`) AS \`updated\`",
        "parameters": {
          "props": {
            "name": "Gypsy",
          },
          "updates": {
            "name": "Curly",
          },
        },
      }
    `);
  });

  it(`should update Cat`, async () => {
    await catsService
      .create({
        name: 'Gypsy',
        age: 5,
        breed: 'Maine Coon',
      })
      .run();

    expect(
      (await catsService.update({ name: 'Gypsy' }, { name: 'Curly' }).run())[0],
    ).toMatchInlineSnapshot(
      {
        created: expect.any(Date),
      },
      `
      {
        "age": 5,
        "breed": "Maine Coon",
        "created": Any<Date>,
        "name": "Curly",
      }
    `,
    );
  });

  it(`should merge Cat query`, async () => {
    expect(
      catsService.merge({
        name: 'Gypsy',
        age: 5,
        breed: 'Maine Coon',
      }).query,
    ).toMatchInlineSnapshot(`
      {
        "cypher": "MERGE (\`n\`:\`Cat\` {\`name\`: $\`props\`.\`name\`, \`age\`: $\`props\`.\`age\`, \`breed\`: $\`props\`.\`breed\`}) ON CREATE SET \`n\`.\`created\` = timestamp() RETURN properties(\`n\`) AS \`merged\`",
        "parameters": {
          "props": {
            "age": Integer {
              "high": 0,
              "low": 5,
            },
            "breed": "Maine Coon",
            "name": "Gypsy",
          },
        },
      }
    `);
  });

  it(`should merge Cat`, async () => {
    expect(
      (
        await catsService
          .merge({
            name: 'Gypsy',
            age: 5,
            breed: 'Maine Coon',
          })
          .run()
      )[0],
    ).toMatchInlineSnapshot(
      {
        created: expect.any(Date),
      },
      `
      {
        "age": 5,
        "breed": "Maine Coon",
        "created": Any<Date>,
        "name": "Gypsy",
      }
    `,
    );

    expect(
      (
        await catsService
          .merge({
            name: 'Gypsy',
            age: 5,
            breed: 'Maine Coon',
          })
          .run()
      )[0],
    ).toMatchInlineSnapshot(
      {
        created: expect.any(Date),
      },
      `
      {
        "age": 5,
        "breed": "Maine Coon",
        "created": Any<Date>,
        "name": "Gypsy",
      }
    `,
    );

    return expect({
      cats: await catsService.findAll().run(),
    }).toMatchInlineSnapshot(
      {
        cats: [
          {
            created: expect.any(Date),
          },
        ],
      },
      `
              {
                "cats": [
                  {
                    "age": 5,
                    "breed": "Maine Coon",
                    "created": Any<Date>,
                    "name": "Gypsy",
                  },
                ],
              }
            `,
    );
  });

  it(`should delete Cat query`, async () => {
    expect(
      catsService.delete({
        name: 'Gypsy',
      }).query,
    ).toMatchInlineSnapshot(`
      {
        "cypher": "MATCH (\`n\`:\`Cat\` {\`name\`: $\`props\`.\`name\`}) WITH n, properties(n) AS \`deleted\` DELETE n RETURN \`deleted\`",
        "parameters": {
          "props": {
            "name": "Gypsy",
          },
        },
      }
    `);
  });

  it(`should delete Cat`, async () => {
    await catsService
      .create({
        name: 'Gypsy',
        age: 5,
        breed: 'Maine Coon',
      })
      .run();

    expect({
      cats: await catsService
        .delete({
          name: 'Gypsy',
        })
        .run(),
    }).toMatchInlineSnapshot(
      {
        cats: [
          {
            created: expect.any(Date),
          },
        ],
      },
      `
      {
        "cats": [
          {
            "age": 5,
            "breed": "Maine Coon",
            "created": Any<Date>,
            "name": "Gypsy",
          },
        ],
      }
    `,
    );

    return expect(await catsService.findAll().run()).toMatchInlineSnapshot(
      `[]`,
    );
  });

  it(`should findBy query`, async () => {
    return expect(catsService.findBy({ name: 'Gypsy' }).query)
      .toMatchInlineSnapshot(`
              {
                "cypher": "MATCH (\`n\`:\`Cat\` {\`name\`: $\`props\`.\`name\`}) RETURN properties(\`n\`) AS \`matched\`",
                "parameters": {
                  "limit": Integer {
                    "high": 0,
                    "low": 100,
                  },
                  "props": {
                    "name": "Gypsy",
                  },
                  "skip": Integer {
                    "high": 0,
                    "low": 0,
                  },
                },
              }
            `);
  });

  it(`should findByName`, async () => {
    await catsService
      .create({
        name: 'Gypsy',
        age: 5,
        breed: 'Maine Coon',
      })
      .run();

    return expect({
      cats: await catsService.findByName('Gypsy').run(),
    }).toMatchInlineSnapshot(
      {
        cats: [
          {
            created: expect.any(Date),
          },
        ],
      },
      `
              {
                "cats": [
                  {
                    "age": 5,
                    "breed": "Maine Coon",
                    "created": Any<Date>,
                    "name": "Gypsy",
                  },
                ],
              }
            `,
    );
  });

  it(`should searchBy query`, async () => {
    return expect(catsService.searchBy('name', 'psy').query)
      .toMatchInlineSnapshot(`
              {
                "cypher": "MATCH (\`n\`:\`Cat\`) WITH n, split(n.\`name\`, ' ') as words
                  WHERE ANY (term IN $terms WHERE ANY(word IN words WHERE word CONTAINS term))
                  WITH n, words, 
                  CASE WHEN apoc.text.join($terms, '') = apoc.text.join(words, '') THEN 100
                  ELSE reduce(s = 0, st IN $terms | s + reduce(s2 = 0, w IN words | CASE WHEN (w = st) THEN (s2 + 4) ELSE CASE WHEN (w CONTAINS st) THEN (s2 +2) ELSE (s2) END END)) END AS score 
                  ORDER BY score DESC SKIP $skip LIMIT $limit RETURN properties(n) as \`matched\`, score",
                "parameters": {
                  "limit": Integer {
                    "high": 0,
                    "low": 100,
                  },
                  "skip": Integer {
                    "high": 0,
                    "low": 0,
                  },
                  "terms": [
                    "psy",
                  ],
                },
              }
            `);
  });

  it(`should searchByName`, async () => {
    await catsService
      .create({
        name: 'Gypsy',
        age: 5,
        breed: 'Maine Coon',
      })
      .run();

    return expect(
      (await catsService.searchByName('psy').run()).map((t) => [
        {
          ...t[0],
          created: 'x',
        },

        t[1],
      ]),
    ).toMatchInlineSnapshot(`
              [
                [
                  {
                    "age": 5,
                    "breed": "Maine Coon",
                    "created": "x",
                    "name": "Gypsy",
                  },
                  2,
                ],
              ]
            `);
  });

  afterAll(async () => {
    await cleanDb(neo4jService);
    return await app.close();
  });
});

describe('Cats E2e disableLosslessIntegers', () => {
  let app: INestApplication;
  let neo4jService: Neo4jService;
  let catsDisableLosslessIntegersService: CatsDisableLosslessIntegersService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppDisableLosslessIntegersModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    neo4jService = app.get<Neo4jService>(Neo4jService);
    catsDisableLosslessIntegersService =
      app.get<CatsDisableLosslessIntegersService>(
        CatsDisableLosslessIntegersService,
      );
  });

  beforeEach(async () => {
    await cleanDb(neo4jService);
  });

  it(`should runCypherConstraints`, async () => {
    return expect(
      await catsDisableLosslessIntegersService.runCypherConstraints(),
    ).toMatchInlineSnapshot(`
              [
                "CREATE CONSTRAINT \`cat_name_key\` IF NOT EXISTS FOR (p:\`Cat\`) REQUIRE p.\`name\` IS NODE KEY",
                "CREATE CONSTRAINT \`cat_age_exists\` IF NOT EXISTS FOR (p:\`Cat\`) REQUIRE p.\`age\` IS NOT NULL",
                "CREATE CONSTRAINT \`cat_breed_exists\` IF NOT EXISTS FOR (p:\`Cat\`) REQUIRE p.\`breed\` IS NOT NULL",
                "CREATE CONSTRAINT \`cat_created_exists\` IF NOT EXISTS FOR (p:\`Cat\`) REQUIRE p.\`created\` IS NOT NULL",
              ]
            `);
  });

  it(`should create Cat query`, async () => {
    expect(
      catsDisableLosslessIntegersService.create({
        name: 'Gypsy',
        age: 5,
        breed: 'Maine Coon',
      }).query,
    ).toMatchInlineSnapshot(`
      {
        "cypher": "CREATE (\`n\`:\`Cat\`) SET n=$props, \`n\`.\`created\` = timestamp() RETURN properties(\`n\`) AS \`created\`",
        "parameters": {
          "props": {
            "age": 5,
            "breed": "Maine Coon",
            "name": "Gypsy",
          },
        },
      }
    `);
  });

  it(`should create Cat`, async () => {
    expect(
      await catsDisableLosslessIntegersService
        .create({
          name: 'Gypsy',
          age: 5,
          breed: 'Maine Coon',
        })
        .run(),
    ).toMatchInlineSnapshot(
      {
        created: expect.any(Date),
      },
      `
      {
        "age": 5,
        "breed": "Maine Coon",
        "created": Any<Date>,
        "name": "Gypsy",
      }
    `,
    );

    return expect({
      cats: await catsDisableLosslessIntegersService.findAll().run(),
    }).toMatchInlineSnapshot(
      {
        cats: [
          {
            created: expect.any(Date),
          },
        ],
      },
      `
                      {
                        "cats": [
                          {
                            "age": 5,
                            "breed": "Maine Coon",
                            "created": Any<Date>,
                            "name": "Gypsy",
                          },
                        ],
                      }
                  `,
    );
  });

  it(`should update Cat query`, async () => {
    expect(
      catsDisableLosslessIntegersService.update(
        { name: 'Gypsy' },
        { name: 'Curly' },
      ).query,
    ).toMatchInlineSnapshot(`
      {
        "cypher": "MATCH (\`n\`:\`Cat\` {\`name\`: $\`props\`.\`name\`}) SET n += $updates RETURN properties(\`n\`) AS \`updated\`",
        "parameters": {
          "props": {
            "name": "Gypsy",
          },
          "updates": {
            "name": "Curly",
          },
        },
      }
    `);
  });

  it(`should update Cat`, async () => {
    await catsDisableLosslessIntegersService
      .create({
        name: 'Gypsy',
        age: 5,
        breed: 'Maine Coon',
      })
      .run();

    expect(
      (
        await catsDisableLosslessIntegersService
          .update({ name: 'Gypsy' }, { name: 'Curly' })
          .run()
      )[0],
    ).toMatchInlineSnapshot(
      {
        created: expect.any(Date),
      },
      `
      {
        "age": 5,
        "breed": "Maine Coon",
        "created": Any<Date>,
        "name": "Curly",
      }
    `,
    );
  });

  it(`should merge Cat query`, async () => {
    expect(
      catsDisableLosslessIntegersService.merge({
        name: 'Gypsy',
        age: 5,
        breed: 'Maine Coon',
      }).query,
    ).toMatchInlineSnapshot(`
      {
        "cypher": "MERGE (\`n\`:\`Cat\` {\`name\`: $\`props\`.\`name\`, \`age\`: $\`props\`.\`age\`, \`breed\`: $\`props\`.\`breed\`}) ON CREATE SET \`n\`.\`created\` = timestamp() RETURN properties(\`n\`) AS \`merged\`",
        "parameters": {
          "props": {
            "age": 5,
            "breed": "Maine Coon",
            "name": "Gypsy",
          },
        },
      }
    `);
  });

  it(`should merge Cat`, async () => {
    expect(
      (
        await catsDisableLosslessIntegersService
          .merge({
            name: 'Gypsy',
            age: 5,
            breed: 'Maine Coon',
          })
          .run()
      )[0],
    ).toMatchInlineSnapshot(
      {
        created: expect.any(Date),
      },
      `
      {
        "age": 5,
        "breed": "Maine Coon",
        "created": Any<Date>,
        "name": "Gypsy",
      }
    `,
    );

    expect(
      (
        await catsDisableLosslessIntegersService
          .merge({
            name: 'Gypsy',
            age: 5,
            breed: 'Maine Coon',
          })
          .run()
      )[0],
    ).toMatchInlineSnapshot(
      {
        created: expect.any(Date),
      },
      `
      {
        "age": 5,
        "breed": "Maine Coon",
        "created": Any<Date>,
        "name": "Gypsy",
      }
    `,
    );

    return expect({
      cats: await catsDisableLosslessIntegersService.findAll().run(),
    }).toMatchInlineSnapshot(
      {
        cats: [
          {
            created: expect.any(Date),
          },
        ],
      },
      `
              {
                "cats": [
                  {
                    "age": 5,
                    "breed": "Maine Coon",
                    "created": Any<Date>,
                    "name": "Gypsy",
                  },
                ],
              }
            `,
    );
  });

  it(`should delete Cat query`, async () => {
    expect(
      catsDisableLosslessIntegersService.delete({
        name: 'Gypsy',
      }).query,
    ).toMatchInlineSnapshot(`
      {
        "cypher": "MATCH (\`n\`:\`Cat\` {\`name\`: $\`props\`.\`name\`}) WITH n, properties(n) AS \`deleted\` DELETE n RETURN \`deleted\`",
        "parameters": {
          "props": {
            "name": "Gypsy",
          },
        },
      }
    `);
  });

  it(`should delete Cat`, async () => {
    await catsDisableLosslessIntegersService
      .create({
        name: 'Gypsy',
        age: 5,
        breed: 'Maine Coon',
      })
      .run();

    expect({
      cats: await catsDisableLosslessIntegersService
        .delete({
          name: 'Gypsy',
        })
        .run(),
    }).toMatchInlineSnapshot(
      {
        cats: [
          {
            created: expect.any(Date),
          },
        ],
      },
      `
      {
        "cats": [
          {
            "age": 5,
            "breed": "Maine Coon",
            "created": Any<Date>,
            "name": "Gypsy",
          },
        ],
      }
    `,
    );

    return expect(
      await catsDisableLosslessIntegersService.findAll().run(),
    ).toMatchInlineSnapshot(`[]`);
  });

  it(`should findBy query`, async () => {
    return expect(
      catsDisableLosslessIntegersService.findBy({ name: 'Gypsy' }).query,
    ).toMatchInlineSnapshot(`
              {
                "cypher": "MATCH (\`n\`:\`Cat\` {\`name\`: $\`props\`.\`name\`}) RETURN properties(\`n\`) AS \`matched\`",
                "parameters": {
                  "limit": Integer {
                    "high": 0,
                    "low": 100,
                  },
                  "props": {
                    "name": "Gypsy",
                  },
                  "skip": Integer {
                    "high": 0,
                    "low": 0,
                  },
                },
              }
            `);
  });

  it(`should findByName`, async () => {
    await catsDisableLosslessIntegersService
      .create({
        name: 'Gypsy',
        age: 5,
        breed: 'Maine Coon',
      })
      .run();

    return expect({
      cats: await catsDisableLosslessIntegersService.findByName('Gypsy').run(),
    }).toMatchInlineSnapshot(
      {
        cats: [
          {
            created: expect.any(Date),
          },
        ],
      },
      `
              {
                "cats": [
                  {
                    "age": 5,
                    "breed": "Maine Coon",
                    "created": Any<Date>,
                    "name": "Gypsy",
                  },
                ],
              }
            `,
    );
  });

  it(`should searchBy query`, async () => {
    return expect(
      catsDisableLosslessIntegersService.searchBy('name', 'psy').query,
    ).toMatchInlineSnapshot(`
              {
                "cypher": "MATCH (\`n\`:\`Cat\`) WITH n, split(n.\`name\`, ' ') as words
                  WHERE ANY (term IN $terms WHERE ANY(word IN words WHERE word CONTAINS term))
                  WITH n, words, 
                  CASE WHEN apoc.text.join($terms, '') = apoc.text.join(words, '') THEN 100
                  ELSE reduce(s = 0, st IN $terms | s + reduce(s2 = 0, w IN words | CASE WHEN (w = st) THEN (s2 + 4) ELSE CASE WHEN (w CONTAINS st) THEN (s2 +2) ELSE (s2) END END)) END AS score 
                  ORDER BY score DESC SKIP $skip LIMIT $limit RETURN properties(n) as \`matched\`, score",
                "parameters": {
                  "limit": Integer {
                    "high": 0,
                    "low": 100,
                  },
                  "skip": Integer {
                    "high": 0,
                    "low": 0,
                  },
                  "terms": [
                    "psy",
                  ],
                },
              }
            `);
  });

  it(`should searchByName`, async () => {
    await catsDisableLosslessIntegersService
      .create({
        name: 'Gypsy',
        age: 5,
        breed: 'Maine Coon',
      })
      .run();

    return expect(
      (await catsDisableLosslessIntegersService.searchByName('psy').run()).map(
        (t) => [
          {
            ...t[0],
            created: 'x',
          },

          t[1],
        ],
      ),
    ).toMatchInlineSnapshot(`
              [
                [
                  {
                    "age": 5,
                    "breed": "Maine Coon",
                    "created": "x",
                    "name": "Gypsy",
                  },
                  2,
                ],
              ]
            `);
  });

  afterAll(async () => {
    await cleanDb(neo4jService);
    return await app.close();
  });
});
