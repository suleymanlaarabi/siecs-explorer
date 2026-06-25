import { QueryClient } from "@tanstack/react-query";

export type Entity = {
  name: string;
  index: number;
  generation: number;
  hasChildren: boolean;
};

export type EntityComponent = {
  id: number;
  name: string;
  value: unknown;
};

export type EntityDetail = Entity & {
  parent?: Entity;
  children: Entity[];
  components: EntityComponent[];
};

export type EntityLike =
  | number
  | Entity
  | {
      index: number;
      generation: number;
    };

export type SiecsClientOptions = {
  host?: string;
  port?: number;
  protocol?: "http" | "https";
};

export class SiecsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SiecsError";
  }
}

export type EditorType =
  | "boolean"
  | "number"
  | "entity"
  | "string"
  | "object"
  | "unsupported";

export type TypeDef = {
  id: number;
  name: string;
  editor: EditorType;
};

export type ComponentField = {
  name: string;
  type: number; // TypeDef["id"]
};

export type ComponentDef = {
  id: number;
  name: string;
  isRelation: boolean;
  type: number; // TypeDef["id"]
  fields: ComponentField[];
};

export type Schema = {
  components: ComponentDef[];
  types: TypeDef[];
};

export class SiecsClient {
  private readonly url: string;

  constructor(options: SiecsClientOptions = {}) {
    const { host = "127.0.0.1", port = 4040, protocol = "http" } = options;

    this.url = `${protocol}://${host}:${port}`;
  }

  async entities(): Promise<Entity[]> {
    return this.get("/entities");
  }

  async schema(): Promise<Schema> {
    return this.get("/schema");
  }

  async entity(entity: EntityLike): Promise<EntityDetail> {
    return this.get(`/entities/${entityId(entity)}`);
  }

  async entityChildren(entity: EntityLike): Promise<Entity[]> {
    return this.get(`/entities/${entityId(entity)}/children`);
  }

  private async get<T>(path: string): Promise<T> {
    const response = await fetch(this.url + path, {
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new SiecsError(`GET ${path} failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}

export function entityId(entity: EntityLike): number {
  if (typeof entity === "object") {
    return entity.index;
  }
  return entity;
}

export const siecsClient = new SiecsClient();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: false,
    },
  },
});
