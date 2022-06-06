<a href="https://nhogs.com"><img src="https://nhogs.com/nhogs_64.png" align="right" alt="nhogs-logo" title="NHOGS Interactive"></a>

# @nhogs/nestjs-neo4j

## Description

[Neo4j](https://neo4j.com/) module for [Nest.js](https://github.com/nestjs/nest).

[![Firebase CI](https://github.com/nhogs/nestjs-neo4j/actions/workflows/e2e-test.yml/badge.svg)](https://github.com/Nhogs/nestjs-neo4j/actions/workflows/e2e-test.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/2de17798cf9b4d9cfd83/maintainability)](https://codeclimate.com/github/Nhogs/nestjs-neo4j/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/2de17798cf9b4d9cfd83/test_coverage)](https://codeclimate.com/github/Nhogs/nestjs-neo4j/test_coverage)

### Peer Dependencies

[![npm peer dependency version NestJS)](https://img.shields.io/npm/dependency-version/@nhogs/nestjs-neo4j/peer/@nestjs/core?label=Nestjs&logo=nestjs&logoColor=e0234e)](https://github.com/nestjs/nest)
[![npm peer dependency version neo4j-driver)](https://img.shields.io/npm/dependency-version/@nhogs/nestjs-neo4j/peer/neo4j-driver?label=neo4j-driver&logo=neo4j)](https://github.com/neo4j/neo4j-javascript-driver)

## Installation

```bash
$ npm i --save @nhogs/nestjs-neo4j
```

## Usage

### In static module definition:

```typescript
@Module({
  imports: [
    Neo4jModule.forRoot({
      scheme: 'neo4j',
      host: 'localhost',
      port: '7687',
      database: 'neo4j',
      username: 'neo4j',
      password: 'test',
      global: true,
    }),
    CatsModule,
  ],
})
export class AppModule {}
```

### In async module definition:

```typescript
@Module({
  imports: [
    Neo4jModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Neo4jConfig => ({
        scheme: configService.get('NEO4J_SCHEME'),
        host: configService.get('NEO4J_HOST'),
        port: configService.get('NEO4J_PORT'),
        username: configService.get('NEO4J_USERNAME'),
        password: configService.get('NEO4J_PASSWORD'),
        database: configService.get('NEO4J_DATABASE'),
      }),
      global: true,
    }),
    PersonModule,
    ConfigModule.forRoot({
      envFilePath: './test/src/.test.env',
    }),
  ],
})
export class AppAsyncModule {}
```

### Write query:

```typescript
await this.neo4jService.write(
  'CREATE (c:`Cat`{name:$name, age:$age, breed:$breed})',
  {
    name: cat.name,
    age: this.neo4jService.int(cat.age),
    breed: cat.breed,
  },
);
```

### Read query:

```typescript
const results = await this.neo4jService.read(
  'MATCH (c:`Cat`) RETURN properties(c) as cat',
);
```

### Define constraints with decorators:

```typescript
@Node({ label: 'Person' })
export class PersonDto {
  @ConstraintKey({
    name: 'person_node_key',
    additionalKeys: ['firstname'],
    ifNotExists: true,
  })
  name: string;

  @ConstraintNotNull({
    ifNotExists: true,
  })
  firstname: string;

  @ConstraintUnique({
    name: 'surname_is_unique',
    ifNotExists: true,
  })
  surname: string;

  @ConstraintNotNull({
    name: 'person_name_exists',
    ifNotExists: true,
  })
  age: number;
}
```

Will generate the following constraints:

```cypher
CREATE CONSTRAINT `person_node_key` IF NOT EXISTS FOR (p:`Person`) REQUIRE (p.`name`, p.`firstname`) IS NODE KEY;
CREATE CONSTRAINT IF NOT EXISTS FOR (p:`Person`) REQUIRE p.`firstname` IS NOT NULL;
CREATE CONSTRAINT `surname_is_unique` IF NOT EXISTS FOR (p:`Person`) REQUIRE p.`surname` IS UNIQUE;
CREATE CONSTRAINT `person_name_exists` IF NOT EXISTS FOR (p:`Person`) REQUIRE p.`age` IS NOT NULL;
```

## License

[MIT licensed](LICENSE).
