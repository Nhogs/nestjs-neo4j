import { Transaction } from 'neo4j-driver';
import { Query } from '../interface';
import { Neo4jModelService } from './neo4j.model.service';
import { Neo4jNodeModelService } from './neo4j.node.model.service';
import { NODE, TIMESTAMP } from '../common';

/**
 * Helper class to generate relationship model service using Neo4j
 */
export abstract class Neo4jRelationshipModelService<
  R,
> extends Neo4jModelService<R> {
  createQuery<F, T>(
    props: Partial<R>,
    fromProps: Partial<F>,
    toProps: Partial<T>,
    fromService: Neo4jNodeModelService<F>,
    toService: Neo4jNodeModelService<T>,
    merge: boolean = false,
    returns: boolean = true,
  ): Query {
    const p = this.toNeo4j(props);
    const fp = fromService.toNeo4j(fromProps);
    const tp = toService.toNeo4j(toProps);

    const MATCH = `MATCH ${NODE('f', fromService.label)}, ${NODE(
      't',
      toService.label,
    )}`;

    const WHERE_CLAUSES = [
      ...Object.keys(fp).map((k) => `f.\`${k}\` = $fp.\`${k}\``),
      ...Object.keys(tp).map((k) => `t.\`${k}\` = $tp.\`${k}\``),
    ].join(' AND ');

    const WHERE = `${WHERE_CLAUSES ? ` WHERE ${WHERE_CLAUSES}` : ''}`;

    const CREATE = `${merge ? ' MERGE' : ' CREATE'} (f)-[r:\`${
      this.label
    }\`]->(t)`;

    const SET = `${p || this.timestamp ? ` SET` : ''}${
      p ? ` r=$p` : ''
    }${TIMESTAMP('r', this.timestamp, p ? ', ' : ' ')}`;

    const RETURN = `${returns ? ` RETURN properties(r) AS created` : ''}`;

    return {
      cypher: `${MATCH}${WHERE}${CREATE}${SET}${RETURN}`,
      parameters: { p, fp, tp },
    };
  }

  async create<F, T>(
    props: Partial<R>,
    fromProps: Partial<F>,
    toProps: Partial<T>,
    fromService: Neo4jNodeModelService<F>,
    toService: Neo4jNodeModelService<T>,
    merge = false,
  ): Promise<R[]> {
    this.logger?.debug('create(' + JSON.stringify(props) + ')');
    return (
      await this._run(
        this.createQuery(
          props,
          fromProps,
          toProps,
          fromService,
          toService,
          merge,
        ),
        {
          write: true,
        },
      )
    ).map((r) => this.fromNeo4j(r.created));
  }

  createInTx<F, T>(
    tx: Transaction,
    props: Partial<R>,
    fromProps: Partial<F>,
    toProps: Partial<T>,
    fromService: Neo4jNodeModelService<F>,
    toService: Neo4jNodeModelService<T>,
    merge = false,
  ): Transaction {
    const query = this.createQuery(
      props,
      fromProps,
      toProps,
      fromService,
      toService,
      merge,
      false,
    );
    tx.run(query.cypher, query.parameters);
    return tx;
  }
}
