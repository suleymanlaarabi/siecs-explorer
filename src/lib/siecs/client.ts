import { SiecsError, readErrorMessage } from './errors';
import { entityId } from './entity';
import type {
  Entity,
  EntityComponent,
  EntityDetail,
  EntityLike,
  EntityRelation,
  LoadedModule,
  Schema,
  SiecsClientOptions,
} from './types';

export class SiecsClient {
  private readonly url: string;

  constructor(options: SiecsClientOptions = {}) {
    const { host = '127.0.0.1', port = 4040, protocol = 'http' } = options;
    this.url = `${protocol}://${host}:${port}`;
  }

  async health(): Promise<boolean> {
    try {
      return (await fetch(`${this.url}/health`)).ok;
    } catch {
      return false;
    }
  }

  entities(): Promise<Entity[]> {
    return this.request('/entities', 'GET');
  }

  allEntities(): Promise<Entity[]> {
    return this.request('/entities/all', 'GET');
  }

  createEntity(): Promise<Entity> {
    return this.request('/entities', 'POST');
  }

  schema(): Promise<Schema> {
    return this.request('/schema', 'GET');
  }

  async saveScene(): Promise<Blob> {
    return this.request('/scene', 'GET', undefined, 'blob');
  }

  async loadScene(data: ArrayBuffer | Blob): Promise<void> {
    await this.request('/scene', 'POST', data, 'empty', 'application/octet-stream');
  }

  loadModule(data: ArrayBuffer | Blob): Promise<LoadedModule> {
    return this.request('/modules', 'POST', data, 'json', 'application/octet-stream');
  }

  entity(entity: EntityLike): Promise<EntityDetail> {
    return this.request(`/entities/${entityId(entity)}`, 'GET');
  }

  entityChildren(entity: EntityLike): Promise<Entity[]> {
    return this.request(`/entities/${entityId(entity)}/children`, 'GET');
  }

  setComponent(entity: EntityLike, componentId: number, value: unknown): Promise<EntityComponent> {
    return this.request(`/entities/${entityId(entity)}/components/${componentId}`, 'PUT', {
      value,
    });
  }

  addComponent(entity: EntityLike, componentId: number, value?: unknown): Promise<EntityComponent> {
    return this.request(
      `/entities/${entityId(entity)}/components/${componentId}`,
      'POST',
      value === undefined ? {} : { value },
    );
  }

  removeComponent(entity: EntityLike, componentId: number): Promise<void> {
    return this.request(
      `/entities/${entityId(entity)}/components/${componentId}`,
      'DELETE',
      undefined,
      'empty',
    );
  }

  setRelation(entity: EntityLike, relationId: number, target: EntityLike): Promise<EntityRelation> {
    return this.request(`/entities/${entityId(entity)}/relations/${relationId}`, 'PUT', {
      target: entityId(target),
    });
  }

  removeRelation(entity: EntityLike, relationId: number): Promise<void> {
    return this.request(
      `/entities/${entityId(entity)}/relations/${relationId}`,
      'DELETE',
      undefined,
      'empty',
    );
  }

  private async request<T>(
    path: string,
    method: string,
    data?: unknown,
    responseType: 'json' | 'blob' | 'empty' = 'json',
    contentType = 'application/json',
  ): Promise<T> {
    const hasBody = data !== undefined;
    const accept =
      responseType === 'blob'
        ? 'application/octet-stream'
        : contentType === 'application/json'
          ? 'application/json'
          : undefined;
    const requestInit: RequestInit = {
      method,
      headers: {
        ...(accept ? { accept } : {}),
        ...(hasBody ? { 'content-type': contentType } : {}),
      },
    };
    if (hasBody)
      requestInit.body =
        contentType === 'application/json' ? JSON.stringify(data) : (data as BodyInit);
    const response = await fetch(`${this.url}${path}`, requestInit);
    if (!response.ok) {
      const serverMessage = await readErrorMessage(response);
      throw new SiecsError(
        `${method} ${path} failed: ${response.status}${serverMessage ? ` — ${serverMessage}` : ''}`,
        response.status,
      );
    }
    if (responseType === 'empty' || response.status === 204) return undefined as T;
    return (responseType === 'blob' ? response.blob() : response.json()) as Promise<T>;
  }
}

export const siecsClient = new SiecsClient();

export type {
  Entity,
  EntityComponent,
  EntityDetail,
  EntityLike,
  EntityRef,
  EntityRelation,
  LoadedModule,
  Schema,
  SiecsClientOptions,
} from './types';
