import { Neo4jMetadataStorage } from '../storage';

export type RelationshipOptions = {
  type: string;
};

export function Relationship(options?: RelationshipOptions): ClassDecorator {
  return (target: Function) => {
    const type = options?.type ? options?.type : target.name;

    Neo4jMetadataStorage.addRelationClassDecorator({ target, type });
  };
}
