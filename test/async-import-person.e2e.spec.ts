import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppAsyncModule } from './src/app.async.module';
import { Neo4jService } from '../lib';
import { PersonDto } from './src/person/dto/person.dto';
import { LikedDto } from './src/person/dto/liked.dto';

describe('Persons', () => {
  let app: INestApplication;
  let neo4jService: Neo4jService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppAsyncModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    neo4jService = app.get<Neo4jService>(Neo4jService);
  });

  beforeEach(async () => {
    await neo4jService.run('MATCH (n) DETACH DELETE n', {
      sessionOptions: { write: true },
    });
  });

  it(`/post /get Person`, (done) => {
    const emma: PersonDto = {
      name: 'Wong',
      firstname: 'Emi',
      age: 18,
      surname: 'Emma',
    };

    const alex: PersonDto = {
      name: 'Smith',
      firstname: 'Alexander',
      age: 22,
      surname: 'Alex',
    };

    const liked: LikedDto = {
      when: '2020',
      since: '2000',
    };

    request(app.getHttpServer())
      .post('/person')
      .send(emma)
      .expect(201)
      .then(() => {
        request(app.getHttpServer())
          .post('/person')
          .send(alex)
          .expect(201)
          .then(() => {
            request(app.getHttpServer())
              .post('/person/Wong/Smith')
              .send(liked)
              .expect(201)
              .then(() => {
                request(app.getHttpServer())
                  .get('/person')
                  .expect(200)
                  .expect([{ ...alex }, { ...emma }])
                  .then(() => {
                    request(app.getHttpServer())
                      .get('/person/liked/Wong')
                      .expect(200)
                      .expect([[liked, { ...alex }]])
                      .then(() => {
                        done();
                      });
                  });
              });
          });
      });
  });

  it('should generate constraints', () => {
    expect(neo4jService.getCypherConstraints()).toMatchInlineSnapshot(`
      Array [
        "CREATE CONSTRAINT \`node_key_with_config\` FOR (p:\`Person\`) REQUIRE (p.\`name\`, p.\`age\`) IS NODE KEY",
        "CREATE CONSTRAINT \`node_exists\` IF NOT EXISTS FOR (p:\`Person\`) REQUIRE p.\`name\` IS NOT NULL",
        "CREATE CONSTRAINT FOR (p:\`Person\`) REQUIRE p.\`name\` IS NOT NULL",
        "CREATE CONSTRAINT FOR (p:\`Person\`) REQUIRE p.\`name\` IS UNIQUE",
        "CREATE CONSTRAINT \`node_key\` FOR (p:\`Person\`) REQUIRE p.\`firstname\` IS NODE KEY",
        "CREATE CONSTRAINT FOR (p:\`Person\`) REQUIRE (p.\`firstname\`, p.\`surname\`) IS NODE KEY",
        "CREATE CONSTRAINT \`uniqueness\` FOR (p:\`Person\`) REQUIRE (p.\`firstname\`, p.\`age\`) IS UNIQUE",
        "CREATE CONSTRAINT \`person_surname_exists\` FOR (p:\`Person\`) REQUIRE p.\`surname\` IS NOT NULL",
        "CREATE CONSTRAINT \`person_surname_unique\` FOR (p:\`Person\`) REQUIRE p.\`surname\` IS UNIQUE",
        "CREATE CONSTRAINT FOR ()-[p:\`LIKED\`]-() REQUIRE p.\`when\` IS NOT NULL",
        "CREATE CONSTRAINT \`relationship_exists\` FOR ()-[p:\`LIKED\`]-() REQUIRE p.\`since\` IS NOT NULL",
      ]
    `);
  });

  it('should generate Person constraints', () => {
    expect(neo4jService.getCypherConstraints('Person')).toMatchInlineSnapshot(`
      Array [
        "CREATE CONSTRAINT \`node_key_with_config\` FOR (p:\`Person\`) REQUIRE (p.\`name\`, p.\`age\`) IS NODE KEY",
        "CREATE CONSTRAINT \`node_exists\` IF NOT EXISTS FOR (p:\`Person\`) REQUIRE p.\`name\` IS NOT NULL",
        "CREATE CONSTRAINT FOR (p:\`Person\`) REQUIRE p.\`name\` IS NOT NULL",
        "CREATE CONSTRAINT FOR (p:\`Person\`) REQUIRE p.\`name\` IS UNIQUE",
        "CREATE CONSTRAINT \`node_key\` FOR (p:\`Person\`) REQUIRE p.\`firstname\` IS NODE KEY",
        "CREATE CONSTRAINT FOR (p:\`Person\`) REQUIRE (p.\`firstname\`, p.\`surname\`) IS NODE KEY",
        "CREATE CONSTRAINT \`uniqueness\` FOR (p:\`Person\`) REQUIRE (p.\`firstname\`, p.\`age\`) IS UNIQUE",
        "CREATE CONSTRAINT \`person_surname_exists\` FOR (p:\`Person\`) REQUIRE p.\`surname\` IS NOT NULL",
        "CREATE CONSTRAINT \`person_surname_unique\` FOR (p:\`Person\`) REQUIRE p.\`surname\` IS UNIQUE",
      ]
    `);
  });

  it('should generate LIKED constraints', () => {
    expect(neo4jService.getCypherConstraints('LIKED')).toMatchInlineSnapshot(`
      Array [
        "CREATE CONSTRAINT FOR ()-[p:\`LIKED\`]-() REQUIRE p.\`when\` IS NOT NULL",
        "CREATE CONSTRAINT \`relationship_exists\` FOR ()-[p:\`LIKED\`]-() REQUIRE p.\`since\` IS NOT NULL",
      ]
    `);
  });

  afterAll(async () => {
    await app.close();
  });
});
