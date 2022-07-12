import { Session, Transaction } from 'neo4j-driver';
import { Query } from '../interface';

export class TransactionChainer {
  constructor(
    private readonly session: Session,
    private readonly tx: Transaction,
  ) {}

  run(query: Query) {
    this.tx.run(query.cypher, query.parameters);
    return this;
  }

  async commit() {
    await this.tx.commit();
    return this;
  }

  async close() {
    await this.tx.close();
    return await this.session.close();
  }
}
