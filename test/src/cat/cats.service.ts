import { Injectable } from "@nestjs/common";
import { Cat } from "./dto/cat";
import { Neo4jModelService, Neo4jService } from "../../../lib";

@Injectable()
export class CatsService extends Neo4jModelService<Cat> {
  constructor(private readonly neo4jService: Neo4jService) {
    super();
  }

  protected getLabel(): string {
    return 'Cat';
  }

  protected getNeo4jService(): Neo4jService {
    return this.neo4jService;
  }

  protected timestampProp(): string | undefined {
    return 'created';
  }
}
