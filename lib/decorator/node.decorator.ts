import { Neo4jMetadataStorage } from '../storage';

export type NodeOptions = {
  label: string;
};

export function Node(options?: NodeOptions): ClassDecorator {
  return (target: Function) => {
    let label: string;

    if (!options) {
      label = target.name;
    } else {
      label = options.label;
    }

    Neo4jMetadataStorage.addNodeClassDecorator({ target, label });
  };
}
