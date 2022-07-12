import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppAsyncModule } from './src/app.async.module';
import { Neo4jService } from '../../lib';
import { PersonDto } from './src/person/dto/person.dto';
import { LikeService } from './src/person/service/like.service';
import { PersonService } from './src/person/service/person.service';
import { CompanyService } from './src/person/service/company.service';
import { WorkInService } from './src/person/service/work.in.service';
import { LikeDto } from './src/person/dto/like.dto';
import { CompanyDto } from './src/person/dto/company.dto';

async function cleanDb(neo4jService: Neo4jService) {
  await neo4jService.run(
    { cypher: 'MATCH (n) DETACH DELETE n' },
    {
      write: true,
    },
  );
}

describe('Persons E2e', () => {
  let app: INestApplication;
  let neo4jService: Neo4jService;
  let likeService: LikeService;
  let personService: PersonService;
  let companyService: CompanyService;
  let workInService: WorkInService;

  const emma: PersonDto = {
    name: 'Wong',
    firstname: 'Emi',
    age: 18,
    surname: 'emma',
  };

  const alex: PersonDto = {
    name: 'Smith',
    firstname: 'Alexander',
    age: 22,
    surname: 'alex',
  };

  const emma_like_alex: LikeDto = {
    when: '2020',
    since: '2000',
  };

  const corp: CompanyDto = {
    name: 'Corp',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppAsyncModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    neo4jService = app.get<Neo4jService>(Neo4jService);
    likeService = app.get<LikeService>(LikeService);
    personService = app.get<PersonService>(PersonService);
    companyService = app.get<CompanyService>(CompanyService);
    workInService = app.get<WorkInService>(WorkInService);
  });

  beforeEach(async () => {
    await cleanDb(neo4jService);
  });

  it(`/post /get Person`, (done) => {
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
              .post('/LIKE/Wong/Smith')
              .send(emma_like_alex)
              .expect(201)
              .then(() => {
                request(app.getHttpServer())
                  .get('/person')
                  .expect(200)
                  .expect([{ ...alex }, { ...emma }])
                  .then(() => {
                    request(app.getHttpServer())
                      .get('/LIKE/Wong')
                      .expect(200)
                      .expect([[emma_like_alex, { ...alex }]])
                      .then(() => {
                        done();
                      });
                  });
              });
          });
      });
  });

  it(`/post /get Person`, (done) => {
    request(app.getHttpServer())
      .post('/person/company')
      .send({
        person: alex,
        company: corp,
      })
      .expect(201)
      .then(() => {
        request(app.getHttpServer())
          .get('/WORK_IN')
          .expect(200)
          .then((value) => {
            expect([value.body[0][0], value.body[0][2]]).toMatchInlineSnapshot(`
              Array [
                Object {
                  "age": 22,
                  "firstname": "Alexander",
                  "name": "Smith",
                  "surname": "alex",
                },
                Object {
                  "name": "Corp",
                },
              ]
            `);
            done();
          });
      });
  });

  it('should generate All constraints', () => {
    expect(neo4jService.getCypherConstraints()).toMatchInlineSnapshot(`
      Array [
        "CREATE CONSTRAINT \`person_name_key\` IF NOT EXISTS FOR (p:\`Person\`) REQUIRE (p.\`name\`, p.\`firstname\`) IS NODE KEY",
        "CREATE CONSTRAINT \`person_firstname_exists\` IF NOT EXISTS FOR (p:\`Person\`) REQUIRE p.\`firstname\` IS NOT NULL",
        "CREATE CONSTRAINT \`person_surname_unique\` IF NOT EXISTS FOR (p:\`Person\`) REQUIRE p.\`surname\` IS UNIQUE",
        "CREATE CONSTRAINT \`person_surname_exists\` IF NOT EXISTS FOR (p:\`Person\`) REQUIRE p.\`surname\` IS NOT NULL",
        "CREATE CONSTRAINT \`person_age_exists\` IF NOT EXISTS FOR (p:\`Person\`) REQUIRE p.\`age\` IS NOT NULL",
        "CREATE CONSTRAINT \`company_name_key\` IF NOT EXISTS FOR (p:\`Company\`) REQUIRE p.\`name\` IS NODE KEY",
        "CREATE CONSTRAINT \`like_when_exists\` IF NOT EXISTS FOR ()-[p:\`LIKE\`]-() REQUIRE p.\`when\` IS NOT NULL",
        "CREATE CONSTRAINT \`like_since_exists\` IF NOT EXISTS FOR ()-[p:\`LIKE\`]-() REQUIRE p.\`since\` IS NOT NULL",
        "CREATE CONSTRAINT \`work_in_since_exists\` IF NOT EXISTS FOR ()-[p:\`WORK_IN\`]-() REQUIRE p.\`since\` IS NOT NULL",
      ]
    `);
  });

  it('should generate Person constraints', () => {
    expect(neo4jService.getCypherConstraints('Person')).toMatchInlineSnapshot(`
      Array [
        "CREATE CONSTRAINT \`person_name_key\` IF NOT EXISTS FOR (p:\`Person\`) REQUIRE (p.\`name\`, p.\`firstname\`) IS NODE KEY",
        "CREATE CONSTRAINT \`person_firstname_exists\` IF NOT EXISTS FOR (p:\`Person\`) REQUIRE p.\`firstname\` IS NOT NULL",
        "CREATE CONSTRAINT \`person_surname_unique\` IF NOT EXISTS FOR (p:\`Person\`) REQUIRE p.\`surname\` IS UNIQUE",
        "CREATE CONSTRAINT \`person_surname_exists\` IF NOT EXISTS FOR (p:\`Person\`) REQUIRE p.\`surname\` IS NOT NULL",
        "CREATE CONSTRAINT \`person_age_exists\` IF NOT EXISTS FOR (p:\`Person\`) REQUIRE p.\`age\` IS NOT NULL",
      ]
    `);
  });

  it('should generate Company constraints', () => {
    expect(neo4jService.getCypherConstraints('Company')).toMatchInlineSnapshot(`
      Array [
        "CREATE CONSTRAINT \`company_name_key\` IF NOT EXISTS FOR (p:\`Company\`) REQUIRE p.\`name\` IS NODE KEY",
      ]
    `);
  });

  it('should generate LIKE constraints', () => {
    expect(neo4jService.getCypherConstraints('LIKE')).toMatchInlineSnapshot(`
      Array [
        "CREATE CONSTRAINT \`like_when_exists\` IF NOT EXISTS FOR ()-[p:\`LIKE\`]-() REQUIRE p.\`when\` IS NOT NULL",
        "CREATE CONSTRAINT \`like_since_exists\` IF NOT EXISTS FOR ()-[p:\`LIKE\`]-() REQUIRE p.\`since\` IS NOT NULL",
      ]
    `);
  });

  it('should generate WORK_IN constraints', () => {
    expect(neo4jService.getCypherConstraints('WORK_IN')).toMatchInlineSnapshot(`
      Array [
        "CREATE CONSTRAINT \`work_in_since_exists\` IF NOT EXISTS FOR ()-[p:\`WORK_IN\`]-() REQUIRE p.\`since\` IS NOT NULL",
      ]
    `);
  });

  it(`Should create like query`, () => {
    const query = likeService.create(
      { when: '2020', since: '2000' },
      { name: 'Wong' },
      { name: 'Smith' },
      personService,
      personService,
    );
    expect(query.query).toMatchInlineSnapshot(`
      Object {
        "cypher": "MATCH (\`f\`:\`Person\`), (\`t\`:\`Person\`) WHERE f.\`name\` = $fp.\`name\` AND t.\`name\` = $tp.\`name\` CREATE (f)-[r:\`LIKE\`]->(t) SET r=$p RETURN properties (f) AS from, properties(r) AS created, properties(t) AS to",
        "parameters": Object {
          "fp": Object {
            "name": "Wong",
          },
          "p": Object {
            "since": "2000",
            "when": "2020",
          },
          "tp": Object {
            "name": "Smith",
          },
        },
      }
    `);
  });

  afterAll(async () => {
    await cleanDb(neo4jService);
    return await app.close();
  });
});
