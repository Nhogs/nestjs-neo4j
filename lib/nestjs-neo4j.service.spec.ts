import { Test, TestingModule } from '@nestjs/testing';
import { NestjsNeo4jService } from './nestjs-neo4j.service';

describe('NestjsNeo4jService', () => {
  let service: NestjsNeo4jService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NestjsNeo4jService],
    }).compile();

    service = module.get<NestjsNeo4jService>(NestjsNeo4jService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
