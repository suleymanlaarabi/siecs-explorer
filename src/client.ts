import { QueryClient } from "@tanstack/react-query";

export type Entity = {
  name: string;
  index: number;
  generation: number;
  hasChildren: boolean;
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

export type ComponentTypeKind = "struct" | "string" | "number";

export type Primitive = "number" | "entity" | "string" | "object";

export type TypeDef = {
  id: number;
  name: string;
  primitive: Primitive;
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

  async entities(parent?: EntityLike): Promise<Entity[]> {
    if (!parent) {
      return this.get("/entities");
    }

    return this.get(`/entities/${entityId(parent)}`);
  }

  async schema(): Promise<Schema> {
    return this.get("/schema");
  }

  async entity(entity: EntityLike): Promise<Entity> {
    return this.get(`/entities/${entityId(entity)}`);
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

export const queryClient = new QueryClient();
