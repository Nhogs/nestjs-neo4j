import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppAsyncModule } from './src/app.async.module';
import { Neo4jService } from '../lib';

describe('Cats', () => {
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

  afterEach(async () => {
    await neo4jService.write('MATCH (n) DETACH DELETE n');
  });

  it(`/post /get cats`, (done) => {
    request(app.getHttpServer())
      .post('/cats')
      .send({ name: 'Toby', age: 3, breed: 'Persan' })
      .expect(201)
      .then(() => {
        request(app.getHttpServer())
          .get('/cats')
          .expect(200)
          .expect([{ name: 'Toby', age: 3, breed: 'Persan' }])
          .then(() => {
            done();
          });
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
