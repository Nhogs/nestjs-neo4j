import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { AppModule } from "./src/app.module";
import { Neo4jService } from "../lib";
import { CatsService } from "./src/cat/cats.service";

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

  afterEach(async () => {
    await neo4jService.write('MATCH (n) DETACH DELETE n');
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

  it(`should create Cat`, async () => {
    expect(
      await catsService.create({
        name: 'Gypsy',
        age: 5,
        breed: 'Maine Coon',
      }),
    ).toMatchInlineSnapshot(
      {
        created: expect.any(Number),
      },
      `
      Object {
        "age": 5,
        "breed": "Maine Coon",
        "created": Any<Number>,
        "name": "Gypsy",
      }
    `,
    );

    return expect(await catsService.findAll()).toMatchInlineSnapshot(
      [
        {
          created: expect.any(Number),
        },
      ],
      `
              Array [
                Object {
                  "age": 5,
                  "breed": "Maine Coon",
                  "created": Any<Number>,
                  "name": "Gypsy",
                },
              ]
            `,
    );
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
        created: expect.any(Number),
      },
      `
      Object {
        "age": 5,
        "breed": "Maine Coon",
        "created": Any<Number>,
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
        created: expect.any(Number),
      },
      `
      Object {
        "age": 5,
        "breed": "Maine Coon",
        "created": Any<Number>,
        "name": "Gypsy",
      }
    `,
    );

    return expect(await catsService.findAll()).toMatchInlineSnapshot(
      [
        {
          created: expect.any(Number),
        },
      ],
      `
              Array [
                Object {
                  "age": 5,
                  "breed": "Maine Coon",
                  "created": Any<Number>,
                  "name": "Gypsy",
                },
              ]
            `,
    );
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
          created: expect.any(Number),
        },
      ],
      `
      Array [
        Object {
          "age": 5,
          "breed": "Maine Coon",
          "created": Any<Number>,
          "name": "Gypsy",
        },
      ]
    `,
    );
    return expect(await catsService.findAll()).toMatchInlineSnapshot(
      `Array []`,
    );
  });

  afterAll(async () => {
    await app.close();
  });
});