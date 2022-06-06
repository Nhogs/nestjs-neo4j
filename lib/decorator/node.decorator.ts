import { Neo4jMetadataStorage } from '../storage';

export type NodeOptions = {
  label: string;
};

export function Node(options?: NodeOptions): ClassDecorator {
  return (target: Function) => {
    let name: string;

    if (!options) {
      name = target.name;
    } else {
      name = options.label;
    }

    Neo4jMetadataStorage.addConstraintClassMetadata({ target, name });
  };
}
