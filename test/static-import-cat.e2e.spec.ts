import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './src/app.module';
import { Neo4jService } from '../lib';
import { CatsService } from './src/cat/cats.service';

describe('Cats', () => {
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
    await neo4jService.run(
      { cypher: 'MATCH (n) DETACH DELETE n' },
      {
        write: true,
      },
    );
  });

  it(`should runCypherConstraints`, async () => {
    return expect(await catsService.runCypherConstraints())
      .toMatchInlineSnapshot(`
              Array [
                "CREATE CONSTRAINT \`cat_name_key\` IF NOT EXISTS FOR (p:\`Cat\`) REQUIRE p.\`name\` IS NODE KEY",
                "CREATE CONSTRAINT \`cat_age_exists\` IF NOT EXISTS FOR (p:\`Cat\`) REQUIRE p.\`age\` IS NOT NULL",
                "CREATE CONSTRAINT \`cat_breed_exists\` IF NOT EXISTS FOR (p:\`Cat\`) REQUIRE p.\`breed\` IS NOT NULL",
                "CREATE CONSTRAINT \`cat_created_exists\` IF NOT EXISTS FOR (p:\`Cat\`) REQUIRE p.\`created\` IS NOT NULL",
              ]
            `);
  });

  it(`should create Cat query`, async () => {
    expect(
      catsService.createQuery({
        name: 'Gypsy',
        age: 5,
        breed: 'Maine Coon',
      }),
    ).toMatchInlineSnapshot(`
      Object {
        "cypher": "CREATE (n:\`Cat\`) SET n=$props SET n.\`created\` = timestamp() RETURN properties(n) AS created",
        "parameters": Object {
          "props": Object {
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
      await catsService.create({
        name: 'Gypsy',
        age: 5,
        breed: 'Maine Coon',
      }),
    ).toMatchInlineSnapshot(
      {
        created: expect.any(String),
      },
      `
      Object {
        "age": 5,
        "breed": "Maine Coon",
        "created": Any<String>,
        "name": "Gypsy",
      }
    `,
    );

    return expect(await catsService.findAll()).toMatchInlineSnapshot(
      [
        {
          created: expect.any(String),
        },
      ],
      `
                      Array [
                        Object {
                          "age": 5,
                          "breed": "Maine Coon",
                          "created": Any<String>,
                          "name": "Gypsy",
                        },
                      ]
                  `,
    );
  });

  it(`should merge Cat query`, async () => {
    expect(
      catsService.mergeQuery({
        name: 'Gypsy',
        age: 5,
        breed: 'Maine Coon',
      }),
    ).toMatchInlineSnapshot(`
      Object {
        "cypher": "MERGE (n:\`Cat\`{\`name\`:$props.\`name\`,\`age\`:$props.\`age\`,\`breed\`:$props.\`breed\`}) ON CREATE SET n.\`created\` = timestamp() RETURN properties(n) AS merged",
        "parameters": Object {
          "props": Object {
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
      await catsService.merge({
        name: 'Gypsy',
        age: 5,
        breed: 'Maine Coon',
      }),
    ).toMatchInlineSnapshot(
      {
        created: expect.any(String),
      },
      `
      Object {
        "age": 5,
        "breed": "Maine Coon",
        "created": Any<String>,
        "name": "Gypsy",
      }
    `,
    );

    expect(
      await catsService.merge({
        name: 'Gypsy',
        age: 5,
        breed: 'Maine Coon',
      }),
    ).toMatchInlineSnapshot(
      {
        created: expect.any(String),
      },
      `
      Object {
        "age": 5,
        "breed": "Maine Coon",
        "created": Any<String>,
        "name": "Gypsy",
      }
    `,
    );

    return expect(await catsService.findAll()).toMatchInlineSnapshot(
      [
        {
          created: expect.any(String),
        },
      ],
      `
                      Array [
                        Object {
                          "age": 5,
                          "breed": "Maine Coon",
                          "created": Any<String>,
                          "name": "Gypsy",
                        },
                      ]
                  `,
    );
  });

  it(`should delete Cat query`, async () => {
    expect(
      catsService.deleteQuery({
        name: 'Gypsy',
      }),
    ).toMatchInlineSnapshot(`
      Object {
        "cypher": "MATCH (n:\`Cat\`{\`name\`:\\"Gypsy\\"}) WITH n, properties(n) AS deleted DELETE n RETURN deleted",
        "parameters": Object {
          "props": Object {
            "name": "Gypsy",
          },
        },
      }
    `);
  });

  it(`should delete Cat`, async () => {
    await catsService.create({
      name: 'Gypsy',
      age: 5,
      breed: 'Maine Coon',
    });

    expect(
      await catsService.delete({
        name: 'Gypsy',
      }),
    ).toMatchInlineSnapshot(
      [
        {
          created: expect.any(String),
        },
      ],
      `
      Array [
        Object {
          "age": 5,
          "breed": "Maine Coon",
          "created": Any<String>,
          "name": "Gypsy",
        },
      ]
    `,
    );

    return expect(await catsService.findAll()).toMatchInlineSnapshot(
      `Array []`,
    );
  });

  it(`should findBy query`, async () => {
    return expect(catsService.findByQuery({ props: { name: 'Gypsy' } }))
      .toMatchInlineSnapshot(`
              Object {
                "cypher": "MATCH (n:\`Cat\`{\`name\`:\\"Gypsy\\"}) RETURN properties(n) AS matched SKIP $skip LIMIT $limit",
                "parameters": Object {
                  "limit": Integer {
                    "high": 0,
                    "low": 10,
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
    await catsService.create({
      name: 'Gypsy',
      age: 5,
      breed: 'Maine Coon',
    });

    return expect(
      await catsService.findByName({ name: 'Gypsy' }),
    ).toMatchInlineSnapshot(
      [
        {
          created: expect.any(String),
        },
      ],
      `
                      Array [
                        Object {
                          "age": 5,
                          "breed": "Maine Coon",
                          "created": Any<String>,
                          "name": "Gypsy",
                        },
                      ]
                  `,
    );
  });
  it(`should searchByQuery query`, async () => {
    return expect(catsService.searchByQuery({ prop: 'name', terms: ['psy'] }))
      .toMatchInlineSnapshot(`
              Object {
                "cypher": "MATCH (n:\`Cat\`) WITH n, split(n.\`name\`, ' ') as words
                  WHERE ANY (term IN $terms WHERE ANY(word IN words WHERE word CONTAINS term))
                  WITH n, words, 
                  CASE WHEN apoc.text.join($terms, '') = apoc.text.join(words, '') THEN 100
                  ELSE reduce(s = 0, st IN $terms | s + reduce(s2 = 0, w IN words | CASE WHEN (w = st) THEN (s2 + 4) ELSE CASE WHEN (w CONTAINS st) THEN (s2 +2) ELSE (s2) END END)) END AS score 
                  ORDER BY score DESC SKIP $skip LIMIT $limit RETURN properties(n) as matched, score",
                "parameters": Object {
                  "limit": Integer {
                    "high": 0,
                    "low": 10,
                  },
                  "skip": Integer {
                    "high": 0,
                    "low": 0,
                  },
                  "terms": Array [
                    "psy",
                  ],
                },
              }
            `);
  });

  it(`should searchByName`, async () => {
    await catsService.create({
      name: 'Gypsy',
      age: 5,
      breed: 'Maine Coon',
    });

    return expect(
      (await catsService.searchByName({ search: 'psy' })).map((t) => [
        { ...t[0], created: 'x' },
        t[1],
      ]),
    ).toMatchInlineSnapshot(`
                    Array [
                      Array [
                        Object {
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
    await app.close();
  });
});
