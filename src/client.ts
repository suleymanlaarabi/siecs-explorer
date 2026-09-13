import { QueryClient } from "@tanstack/react-query";

export type EntityRef = {
  name: string;
  index: number;
  generation: number;
};

export type Entity = EntityRef & {
  hasChildren: boolean;
};

export type EntityRelation = {
  id: number;
  name: string;
  target: EntityRef;
};

export type EntityComponent = {
  id: number;
  name: string;
  value: unknown;
};

export type EntityDetail = EntityRef & {
  children: Entity[];
  components: EntityComponent[];
  relations: EntityRelation[];
};

export type EntityLike = number | EntityRef;

export type SiecsClientOptions = {
  host?: string;
  port?: number;
  protocol?: "http" | "https";
};

export class SiecsError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "SiecsError";
    this.status = status;
  }
}

export type EditorType = "boolean" | "number" | "entity" | "string" | "object" | "unsupported";

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

export class SiecsClient {
  private readonly url: string;

  constructor(options: SiecsClientOptions = {}) {
    const { host = "127.0.0.1", port = 4040, protocol = "http" } = options;

    this.url = `${protocol}://${host}:${port}`;
  }

  async health(): Promise<boolean> {
    try {
      const result = await fetch(this.url + "/health");
      if (result.ok) return true;
      return false;
    } catch {
      return false;
    }
  }

  async entities(): Promise<Entity[]> {
    return this.get("/entities");
  }

  async createEntity(): Promise<Entity> {
    return this.post("/entities");
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

  async setComponent(
    entity: EntityLike,
    componentId: number,
    value: unknown,
  ): Promise<EntityComponent> {
    return this.put<EntityComponent>(`/entities/${entityId(entity)}/components/${componentId}`, {
      value,
    });
  }

  async addComponent(
    entity: EntityLike,
    componentId: number,
    value?: unknown,
  ): Promise<EntityComponent> {
    return this.post<EntityComponent>(
      `/entities/${entityId(entity)}/components/${componentId}`,
      value === undefined ? {} : { value },
    );
  }

  async removeComponent(entity: EntityLike, componentId: number): Promise<void> {
    return this.delete(`/entities/${entityId(entity)}/components/${componentId}`);
  }

  async setRelation(
    entity: EntityLike,
    relationId: number,
    target: EntityLike,
  ): Promise<EntityRelation> {
    return this.put<EntityRelation>(`/entities/${entityId(entity)}/relations/${relationId}`, {
      target: entityId(target),
    });
  }

  async removeRelation(entity: EntityLike, relationId: number): Promise<void> {
    return this.delete(`/entities/${entityId(entity)}/relations/${relationId}`);
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

  private async request<T>(path: string, method: string, data: unknown = undefined): Promise<T> {
    const response = await fetch(this.url + path, {
      headers: {
        accept: "application/json",
        ...(data !== undefined ? { "content-type": "application/json" } : {}),
      },
      method,
      body: data != undefined ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const serverMessage = await readErrorMessage(response);
      throw new SiecsError(
        `${method} ${path} failed: ${response.status}${serverMessage ? ` — ${serverMessage}` : ""}`,
        response.status,
      );
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  private async post<T>(path: string, data: unknown = undefined): Promise<T> {
    return this.request(path, "POST", data);
  }
  private async put<T>(path: string, data: unknown = undefined): Promise<T> {
    return this.request(path, "PUT", data);
  }
  private async delete<T = void>(path: string): Promise<T> {
    return this.request(path, "DELETE");
  }
}

async function readErrorMessage(response: Response) {
  const text = await response.text();
  if (!text) return "";
  try {
    const body = JSON.parse(text) as { message?: unknown; error?: unknown };
    const message = body.message ?? body.error;
    return typeof message === "string" ? message : text;
  } catch {
    return text;
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

setInterval(() => {});
