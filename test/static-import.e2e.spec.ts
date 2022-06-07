import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './src/app.module';
import { Neo4jService } from '../lib';

describe('Cats', () => {
  let app: INestApplication;
  let neo4jService: Neo4jService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    neo4jService = app.get<Neo4jService>(Neo4jService);
  });

  afterEach(async () => {
    await neo4jService.write('MATCH (n) DETACH DELETE n');
  });

  it('should generate constraints', async () => {
    const constraints = neo4jService.getCypherConstraints();
    expect(constraints).toMatchInlineSnapshot(`
      Array [
        "CREATE CONSTRAINT \`cat_name_unique\` IF NOT EXISTS FOR (p:\`Cat\`) REQUIRE p.\`name\` IS NODE KEY",
      ]
    `);

    await neo4jService.write(constraints[0]);
  });

  it(`/post /get cats`, (done) => {
    request(app.getHttpServer())
      .post('/cats')
      .send({ name: 'Gypsy', age: 5, breed: 'Maine Coon' })
      .expect(201)
      .then(() => {
        request(app.getHttpServer())
          .get('/cats')
          .expect(200)
          .expect([{ name: 'Gypsy', age: 5, breed: 'Maine Coon' }])
          .then(() => {
            done();
          });
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
