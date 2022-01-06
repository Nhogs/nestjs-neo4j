import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './src/app.module';

describe('Cats', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
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
