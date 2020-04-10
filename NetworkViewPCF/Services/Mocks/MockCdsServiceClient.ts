/* eslint-disable @typescript-eslint/no-unused-vars */
import { CdsServiceClient } from "../CdsSdk/CdsServiceClient";

export class MockCdsServiceClient implements CdsServiceClient {
  create(entity: import("../CdsSdk/CdsSdk").IEntity): Promise<string> {
    throw new Error("Method not implemented.");
  }
  update(entity: import("../CdsSdk/CdsSdk").IEntity): Promise<void> {
    throw new Error("Method not implemented.");
  }
  delete(entityName: string, id: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  retrieve<T extends import("../CdsSdk/CdsSdk").IEntity>(
    entityName: string,
    id: string,
    columnSet: boolean | string[],
  ): Promise<T> {
    throw new Error("Method not implemented.");
  }
  retrieveMultiple<T extends import("../CdsSdk/CdsSdk").IEntity>(
    fetchxml: string,
  ): Promise<import("../CdsSdk/CdsSdk").EntityCollection<T>> {
    throw new Error("Method not implemented.");
  }
  associate(
    entityName: string,
    entityId: string,
    relationship: string,
    relatedEntities: Promise<import("../CdsSdk/CdsSdk").EntityReference[]>,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
  disassociate(
    entityName: string,
    entityId: string,
    relationship: string,
    relatedEntities: import("../CdsSdk/CdsSdk").EntityReference[],
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
