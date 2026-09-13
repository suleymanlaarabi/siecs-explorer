export type EntityRef = {
  name: string;
  index: number;
  generation: number;
};

export type Entity = EntityRef & { hasChildren: boolean };

export type EntityRelation = { id: number; name: string; target: EntityRef };

export type EntityComponent = { id: number; name: string; value: unknown };

export type EntityDetail = EntityRef & {
  children: Entity[];
  components: EntityComponent[];
  relations: EntityRelation[];
};

export type EntityLike = number | EntityRef;

export type LoadedModule = {
  id: number;
  name: string;
  enabled: boolean;
  replaced: number;
};

export type SiecsClientOptions = {
  host?: string;
  port?: number;
  protocol?: 'http' | 'https';
};

export type EditorType = 'boolean' | 'number' | 'entity' | 'string' | 'object' | 'unsupported';

export type TypeDef = { id: number; name: string; editor: EditorType };

export type ComponentField = { name: string; type: number };

export type ComponentDef = {
  id: number;
  name: string;
  isRelation: boolean;
  type: number;
  fields: ComponentField[];
};

export type RelationDef = {
  id: number;
  name: string;
  storage: number;
  onDeleteTarget: number;
  acyclic: boolean;
};

export type Schema = {
  components: ComponentDef[];
  relations: RelationDef[];
  types: TypeDef[];
};
