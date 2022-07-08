import { Transaction } from 'neo4j-driver';
import { Query } from '../interface';
import { Neo4jModelService } from './neo4j.model.service';
import { Neo4jNodeModelService } from './neo4j.node.model.service';

/**
 * Helper class to generate relationship model service using Neo4j
 */
export abstract class Neo4jRelationshipModelService<
  R,
> extends Neo4jModelService<R> {
  createQuery<F, T>(
    props: Record<string, any>,
    fromProps: Record<string, any>,
    toProps: Record<string, any>,
    fromService: Neo4jNodeModelService<F>,
    toService: Neo4jNodeModelService<T>,
    returns: boolean = true,
  ): Query {
    const p = this.toNeo4j(props);
    const fp = fromService.toNeo4j(fromProps);
    const tp = toService.toNeo4j(toProps);

    const match = `(f:\`${fromService.label}\`), (t:\`${toService.label}\`)`;

    const where = [
      ...Object.keys(fp).map((k) => `f.\`${k}\` = $fp.\`${k}\``),
      ...Object.keys(tp).map((k) => `t.\`${k}\` = $tp.\`${k}\``),
    ].join(' AND ');

    const create = `(f)-[r:\`${this.label}\`]->(t) SET r=$p`;

    return {
      cypher: `MATCH ${match}${
        where ? ` WHERE ${where}` : ''
      } CREATE ${create}${
        this.timestamp ? `, n.\`${this.timestamp}\` = timestamp() ` : ''
      }${returns ? ` RETURN properties(r) AS created` : ''}`,
      parameters: { p, fp, tp },
    };
  }

  async create<F, T>(
    props: Record<string, any>,
    fromProps: Record<string, any>,
    toProps: Record<string, any>,
    fromService: Neo4jNodeModelService<F>,
    toService: Neo4jNodeModelService<T>,
  ): Promise<R[]> {
    this.logger?.debug('create(' + JSON.stringify(props) + ')');
    return (
      await this._runWithDebug(
        this.createQuery(props, fromProps, toProps, fromService, toService),
        {
          write: true,
        },
      )
    ).map((r) => this.fromNeo4j(r.created));
  }

  createInTx<F, T>(
    tx: Transaction,
    props: Record<string, any>,
    fromProps: Record<string, any>,
    toProps: Record<string, any>,
    fromService: Neo4jNodeModelService<F>,
    toService: Neo4jNodeModelService<T>,
  ): Transaction {
    const query = this.createQuery(
      props,
      fromProps,
      toProps,
      fromService,
      toService,
      false,
    );
    tx.run(query.cypher, query.parameters);
    return tx;
  }
}
