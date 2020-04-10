/* eslint-disable @typescript-eslint/no-unused-vars */
import { IEntity, odataify, Entity, Guid, EntityCollection, sdkify, EntityReference } from "./CdsSdk";
import { CdsServiceClient } from "./CdsServiceClient";

export class XrmContextCdsServiceClient implements CdsServiceClient {
  _webApi: Xrm.WebApi;
  constructor(webApi: Xrm.WebApi) {
    this._webApi = webApi;
  }
  async create(entity: IEntity): Promise<string> {
    const record = odataify("Create", entity);
    const response = await this._webApi.createRecord(entity.logicalName, record);
    return response.id as string;
  }

  async update(entity: IEntity): Promise<void> {
    const record = odataify("Update", entity);
    // Get the primary key attribute
    const entityMetadat = Entity.getMetadataByLogicalName(entity.logicalName);
    const id = entity[entityMetadat.primaryIdAttribute];

    // Delete the lookups with null
    // Support for updating related entities separately like we do in the node implementation
    // otherwise we get "CRM do not support direct update of Entity Reference properties, Use Navigation properties instead."
    for (const attribute in record) {
      if (attribute.endsWith("@odata.bind") && record[attribute].endsWith("(null)")) {
        const dissassociateRequest = new (class {
          target = {
            id: id,
            entityType: entity.logicalName,
          };
          relationship = attribute.substr(0, attribute.length - "@odata.bind".length);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getMetadata(): any {
            return {
              parameterTypes: {},
              operationType: 2,
              operationName: "Disassociate",
            };
          }
        })();

        await Xrm.WebApi.online.execute(dissassociateRequest);
        delete record[attribute];
      }
    }
    try {
      await this._webApi.updateRecord(entity.logicalName, id, record);
    } catch (ex) {
      throw new Error("Error during update:" + ex.message);
    }
  }

  async delete(entityName: string, id: Guid): Promise<void> {
    await this._webApi.deleteRecord(entityName, id);
  }

  async retrieve<T extends IEntity>(entityName: string, id: Guid, columnSet: string[] | boolean): Promise<T> {
    let query = "";
    const entityMetadata = Entity.getMetadataByLogicalName(entityName);
    const cols: string[] = [];
    // Construct the select based on the columns requested
    if (columnSet && !(columnSet instanceof Boolean)) {
      for (const attribute of columnSet as string[]) {
        let correctedAttribute = attribute;
        // If the attribute is a navigation property then format it correctly
        if (entityMetadata.navigation && entityMetadata.navigation[attribute]) {
          correctedAttribute = "_" + attribute + "_value";
        }
        cols.push(correctedAttribute);
      }

      query = `?$select=${(cols as string[]).join(",")}`;
    }
    const response = await this._webApi.retrieveRecord(entityName, id, query);
    const sdkified = (await sdkify(response, entityName)) as T;
    return sdkified;
  }

  private getEntityLogicalNameFromFetch(fetch: string): string {
    const domParser = new DOMParser();
    const parsedFetch = domParser.parseFromString(fetch, "text/html");
    const attributeLogicalName = parsedFetch
      .getElementsByTagName("fetch")[0]
      .getElementsByTagName("entity")[0]
      .getAttributeNode("name");
    return attributeLogicalName ? attributeLogicalName.value : "";
  }

  async retrieveMultiple<T extends IEntity>(fetchxml: string): Promise<EntityCollection<T>> {
    const logicalName = this.getEntityLogicalNameFromFetch(fetchxml);
    const results = await this._webApi.retrieveMultipleRecords(
      logicalName,
      "?fetchXml=" + encodeURIComponent(fetchxml),
    );
    const output = [];
    for (const record of results.entities) {
      const sdkified = (await sdkify(record, logicalName)) as T;
      output.push(sdkified);
    }

    const entities = new EntityCollection(output);
    return entities;
  }

  async associate(
    entityName: string,
    entityId: string,
    relationship: string,
    relatedEntities: Promise<EntityReference[]>,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async disassociate(
    entityName: string,
    entityId: string,
    relationship: string,
    relatedEntities: EntityReference[],
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
