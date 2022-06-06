import { Neo4jMetadataStorage } from '../storage';

export type RelationshipOptions = {
  name: string;
};

export function Relationship(options?: RelationshipOptions): ClassDecorator {
  return (target: Function) => {
    const relName = options?.name ? options?.name : target.name;

    Neo4jMetadataStorage.addConstraintClassMetadata({
      target,
      name: relName,
      isRel: true,
    });
  };
}
