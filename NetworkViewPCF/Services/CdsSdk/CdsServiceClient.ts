import { IEntity, Guid, EntityCollection, EntityReference } from "./CdsSdk";

export interface CdsServiceClient {
  create(entity: IEntity): Promise<string>;
  update(entity: IEntity): Promise<void>;
  delete(entityName: string, id: Guid): Promise<void>;
  retrieve<T extends IEntity>(entityName: string, id: Guid, columnSet: string[] | boolean): Promise<T>;
  retrieveMultiple<T extends IEntity>(fetchxml: string): Promise<EntityCollection<T>>;
  associate(
    entityName: string,
    entityId: string,
    relationship: string,
    relatedEntities: Promise<EntityReference[]>,
  ): Promise<void>;
  disassociate(
    entityName: string,
    entityId: string,
    relationship: string,
    relatedEntities: EntityReference[],
  ): Promise<void>;
}
