import { Logger } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';

/**
 * Helper class to generate model service using Neo4j
 */
export abstract class Neo4jModelService<T> {
  protected abstract getLabel(): string;
  protected abstract getNeo4jService(): Neo4jService;
  protected abstract getLogger(): Logger;

  async runCypherConstraints(): Promise<string[]> {
    this.getLogger()?.debug('runCypherConstraints()');
    const queries = this.getNeo4jService().getCypherConstraints(
      this.getLabel(),
    );

    const session = this.getNeo4jService().getWriteSession();
    const tx = session.beginTransaction();
    queries.forEach((query) => {
      tx.run(query);
    });
    await tx.commit();
    return queries;
  }

  async create(props: Record<string, any>): Promise<T> {
    this.getLogger()?.debug('create(' + JSON.stringify(props) + ')');

    let cypher = `CREATE (n:\`${this.getLabel()}\`) SET n=$props RETURN properties(n) AS created`;

    this.getLogger()?.debug(cypher);

    const res = await this.getNeo4jService().write(cypher, {
      props,
    });

    const record = res.records[0]?.toObject();
    this.getLogger()?.debug(record);
    return record ? (record.created as T) : undefined;
  }

  async merge(props: Record<string, any>): Promise<T> {
    this.getLogger()?.debug('merge(' + JSON.stringify(props) + ')');

    let cypher = `MERGE (n:\`${this.getLabel()}\`{${Object.keys(props).map(
      (k) => '`' + k + '`:' + JSON.stringify(props[k]),
    )}}) RETURN properties(n) AS merged`;

    this.getLogger()?.debug(cypher);

    const res = await this.getNeo4jService().write(cypher, {
      props,
    });

    const record = res.records[0]?.toObject();
    this.getLogger()?.debug(record);
    return record ? (record.merged as T) : undefined;
  }

  async delete(props: Record<string, any>): Promise<T[]> {
    this.getLogger()?.debug('delete(' + JSON.stringify(props) + ')');

    let cypher = `MATCH (n:\`${this.getLabel()}\`{${Object.keys(props).map(
      (k) => '`' + k + '`:' + JSON.stringify(props[k]),
    )}}) WITH n, properties(n) AS deleted DELETE n RETURN deleted`;

    this.getLogger()?.debug(cypher);

    const res = await this.getNeo4jService().write(cypher, {
      props,
    });

    const records = res.records
      ? res.records.map((r) => r.toObject().deleted)
      : [];
    this.getLogger()?.debug(JSON.stringify(records));
    return records as T[];
  }

  async findAll(params: {
    skip?: number;
    limit?: number;
    orderBy?: string;
    descending?: boolean;
  }): Promise<T[]> {
    this.getLogger()?.debug('findAll(' + JSON.stringify(params) + ')');

    let cypher = `MATCH (n:\`${this.getLabel()}\`) RETURN properties(n) AS matched${
      params.orderBy
        ? ` ORDER BY n.\`${params.orderBy}\`` +
          (params.descending ? ' DESC' : '')
        : ''
    } SKIP $skip LIMIT $limit`;

    this.getLogger()?.debug(cypher);

    const res = await this.getNeo4jService().read(cypher, {
      skip: this.getNeo4jService().int(params.skip || 0),
      limit: this.getNeo4jService().int(params.limit || 10),
    });
    return res.records.map((r) => r.toObject().matched as T);
  }

  async findBy(params: {
    props: Record<string, any>;
    skip?: number;
    limit?: number;
    orderBy?: string;
    descending?: boolean;
  }): Promise<T[]> {
    this.getLogger()?.debug('findBy(' + JSON.stringify(params) + ')');

    let cypher = `MATCH (n:\`${this.getLabel()}\`{${Object.keys(
      params.props,
    ).map(
      (k) => '`' + k + '`:' + JSON.stringify(params.props[k]),
    )}}) RETURN properties(n) AS matched${
      params.orderBy
        ? ` ORDER BY n.\`${params.orderBy}\`` +
          (params.descending ? ' DESC' : '')
        : ''
    } SKIP $skip LIMIT $limit`;

    this.getLogger()?.debug(cypher);

    const res = await this.getNeo4jService().read(cypher, {
      skip: this.getNeo4jService().int(params.skip || 0),
      limit: this.getNeo4jService().int(params.limit || 10),
    });
    return res.records.map((r) => r.toObject().matched as T);
  }

  async searchBy(params: {
    prop: string;
    terms: string[];
    skip?: number;
    limit?: number;
  }): Promise<[T, number][]> {
    this.getLogger()?.debug('findBy(' + JSON.stringify(params) + ')');

    let cypher = `
    MATCH (n:\`${this.getLabel()}\`)
    WITH n, split(n.\`${params.prop}\`, ' ') as words
    WHERE ANY (term IN $terms WHERE ANY(word IN words WHERE word CONTAINS term))
    WITH n, words, 
    CASE 
      WHEN apoc.text.join($terms, '') = apoc.text.join(words, '')
    THEN 100
    ELSE 
      reduce(
        s = 0,
        st IN $terms |
        s + reduce(
          s2 = 0,
          w IN words |
          CASE WHEN (w = st) THEN (s2 + 4) ELSE CASE WHEN (w CONTAINS st) THEN (s2 +2) ELSE (s2) END END
        )
      ) 
    END AS score 
    ORDER BY score DESC SKIP $skip LIMIT $limit
    RETURN properties(n) as matched, score`;

    this.getLogger()?.debug(cypher);

    const res = await this.getNeo4jService().read(cypher, {
      terms: params.terms,
      skip: this.getNeo4jService().int(params.skip || 0),
      limit: this.getNeo4jService().int(params.limit || 10),
    });

    return res.records.map((r) => {
      const toObject = r.toObject();
      return [toObject.matched as T, toObject.score];
    });
  }
}
