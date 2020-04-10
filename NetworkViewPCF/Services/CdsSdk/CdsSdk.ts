/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/interface-name-prefix */
export type Guid = string;
export function trimGuid(guid: string) {
  return guid.replace("{", "").replace("}", "");
}
export function normaliseGuid(guid: string | undefined) {
  if (guid) {
    guid = guid.toLowerCase();
    if (!guid.startsWith("{")) {
      guid = "{" + guid + "}";
    }
  }
  return guid;
}
export function guidEqual(guid1: string | undefined, guid2: string | undefined) {
  if (guid1 && guid2) {
    return trimGuid(guid1).toLowerCase() == trimGuid(guid2).toLowerCase();
  } else if (!guid1 && !guid2) {
    return true;
  }
  return false;
}
export interface MetadataCache {
  entitySetNames: Dictionary<string>;
  entities: Dictionary<EntityWebApiMetadata>;
  actions: Dictionary<WebApiExecuteRequestMetadata>;
}
export interface NavigationPropertyMetadata {
  logicalNames: string[];
}
export interface EntityWebApiMetadata {
  typeName?: string;
  logicalName: string;
  collectionName: string;
  primaryIdAttribute: string;
  attributeTypes: Dictionary<string>;
  navigation?: Dictionary<string[]>;
}
export interface Dictionary<T> {
  [key: string]: T;
}
export interface ParameterType {
  typeName: string;
  structuralProperty: StructuralProperty;
}
export enum StructuralProperty {
  Unknown = 0,
  PrimitiveType = 1,
  ComplexType = 2,
  EnumerationType = 3,
  Collection = 4,
  EntityType = 5,
}
export enum OperationType {
  Action = 0,
  Function = 1,
  CRUD = 2,
}
export enum AttributeTypes {
  EntityCollection = 0,
  EntityReference = 1,
  Money = 2,
  OptionSetValue = 3,
  MultiSelectOptionSetValue = 4,
  Date = 5,
  DateTime = 6,
  Unknown = 1000,
}
export interface WebApiExecuteRequestMetadata {
  boundParameter?: string;
  parameterTypes: Dictionary<ParameterType>;
  operationType: OperationType;
  operationName: string;
}
export interface WebApiExecuteRequest {
  logicalName: string;
  [index: string]: any;
}
export interface IEntity {
  id?: Guid;
  logicalName: string;
  [index: string]: any;
  formattedValues?: Dictionary<string>;
}
export interface OptionSetValue {
  name: string;
  value: number;
}
export enum activityparty_participationtypemask {
  Sender = 1,
  To_Recipient = 2,
  CC_Recipient = 3,
  BCC_Recipient = 4,
  Required_attendee = 5,
  Optional_attendee = 6,
  Organizer = 7,
  Regarding = 8,
  Owner = 9,
  Resource = 10,
  Customer = 11,
}
export interface ActivityParty extends IEntity {
  /**Activity		LookupType
        Unique identifier of the activity associated with the activity party. (A "party" is any person who is associated with an activity.)
        */
  activityid?: EntityReference;
  /**Activity Party		UniqueidentifierType
        Unique identifier of the activity party.
        */
  activitypartyid?: Guid;

  /**Participation Type		activityparty_activityparty_participationtypemask
        Role of the person in the activity, such as sender, to, cc, bcc, required, optional, organizer, regarding, or owner.
        */
  participationtypemask?: activityparty_participationtypemask;
  /**Party		LookupType
        Unique identifier of the party associated with the activity.
        */
  partyid?: EntityReference;
  /**Resource Specification		LookupType
        Unique identifier of the resource specification for the activity party.
        */
  resourcespecid?: EntityReference;
}
export let _metadataCache: MetadataCache;

export function setMetadataCache(metadataCache: MetadataCache) {
  _metadataCache = metadataCache;
}
export function getMetadataCache(): MetadataCache {
  if (_metadataCache == null) {
    throw new Error("Metadata cache is not initialised. Ensure that setMetadata is called");
  }
  return _metadataCache;
}
export class EntityReference {
  constructor(logicalName?: string, id?: Guid) {
    this.entityType = logicalName;
    this.id = id;
  }
  entityType?: string;
  id?: string;
  name?: string;
}
export class Entity {
  static entitySetNames: Dictionary<string> = {};
  static getMetadataFromEntitySet(entitySetName: string) {
    const metadataCache = getMetadataCache();
    // Check the metadata
    for (const logicalName of Object.keys(metadataCache.entities)) {
      // Check logical name

      const metadata = metadataCache.entities[logicalName] as EntityWebApiMetadata;
      if (metadata.collectionName == entitySetName) return metadata;
    }
    return null;
    // TODO: Get metadata from server
  }
  static getEntitySetName(entityLogicalName: string) {
    const metadataCache = getMetadataCache();
    // Check the generated metadata
    const metadata = metadataCache.entitySetNames[entityLogicalName];
    if (metadata != undefined) {
      return metadata;
    }

    // Check the cache
    if (this.entitySetNames[entityLogicalName] != undefined) {
      return this.entitySetNames[entityLogicalName];
    }

    throw new Error(`Cannot find entity metadata for ${entityLogicalName}. Please generate early bound types`);
    // Lookup the entity set name from the logical name
    // const entityMetadata = await Xrm.Utility.getEntityMetadata(entityLogicalName, ["EntitySetName"]);
    // this.entitySetNames[entityLogicalName] = entityMetadata.EntitySetName;
    // return entityMetadata.EntitySetName;
  }
  static getMetadata(entity: IEntity) {
    const logicalName = entity.logicalName;
    return Entity.getMetadataByLogicalName(logicalName);
  }
  static getMetadataByLogicalName(logicalName: string) {
    const metadataCache = getMetadataCache();
    const metadata = metadataCache.entities[logicalName] as EntityWebApiMetadata;
    if (!metadata) throw new Error(`Metadata not found for ${logicalName}. Please create the early bound types.`);
    return metadata;
  }
  static containsFields(instance: any, keys: string[]) {
    let allOk = true;
    for (const key of keys) {
      allOk = allOk && instance[key] != undefined;
      if (!allOk) break;
    }
    return allOk;
  }
  static getCollectionNameForEntity(logicalName: string) {
    // Try using the simple collection name lookup
    const collectionName = Entity.getEntitySetName(logicalName);

    return collectionName;
  }
  static odatifyEntityReference(entitySetName: string, id: string) {
    return `${entitySetName}(${trimGuid(id)})`;
  }
  static getNavigationPathForEntityReference(entity: IEntity, attributeLogicalName: string) {
    const metadata = Entity.getMetadata(entity);

    // Does the entity contain the metadata for the navigation property?
    const navigation = getNavigationProperty(attributeLogicalName, metadata);
    if (metadata != null && metadata.navigation && navigation) {
      const entityReference = entity[attributeLogicalName] as EntityReference;

      const entitySetName = Entity.getEntitySetName(<string>entityReference.entityType);

      if (!entityReference.id) throw new Error(`No id set on entityreference for ${attributeLogicalName}`);

      return Entity.odatifyEntityReference(entitySetName, entityReference.id);
    }

    const collectionName = Entity.getCollectionNameForEntity(attributeLogicalName);
    if (collectionName) {
      if (!entity.id) throw new Error(`No id set on entityreference for ${attributeLogicalName}`);

      return Entity.odatifyEntityReference(collectionName, entity.id);
    }

    throw new Error(`Cannot find navigation metadata for ${attributeLogicalName}`);
  }
}
export function toEntityReference(record: IEntity) {
  let id = record.id;
  // Set the id field if not already
  if (id == undefined || id === null) {
    const metadata = Entity.getMetadata(record);
    id = record[metadata.primaryIdAttribute];
  }

  return {
    id: id,
    entityType: record.logicalName,
  } as EntityReference;
}
function getNavigationProperty(fieldLogicalName: string, metadata: EntityWebApiMetadata) {
  const fieldLower = fieldLogicalName.toLowerCase();
  const navs = <Dictionary<string[]>>metadata.navigation;
  for (const f in navs) {
    if (f.toLowerCase() == fieldLower) {
      // Return the actual casing of the field
      return {
        field: f,
        navigation: navs[f],
      };
    }
  }
  return null;
}
export function fromEntityReference(record: IEntity, entityReference: EntityReference) {
  if (record.logicalName !== entityReference.entityType)
    throw new Error(`Cannot map ${entityReference.entityType} into ${record.logicalName}`);
  record.id = entityReference.id;
}
export function odataify(
  action: "Create" | "Update" | "Action",
  value: IEntity | WebApiExecuteRequest | object,
): any | any[] {
  // TODO: Do we need these parameters? Action is also used for Functions
  const metadataCache = getMetadataCache();

  // Is the value an array or Entitycollection?
  if (value.constructor.name == "Array") {
    const odataRecords: any = [];
    for (const record of <IEntity[]>value) {
      odataRecords.push(odataify(action, record));
    }
    return odataRecords;
  }
  // EntityCollection
  else if ((<EntityCollection<IEntity>>value).entities != undefined) {
    return odataify(action, (<EntityCollection<IEntity>>value).entities);
  }

  const logicalName = (value as IEntity).logicalName;
  if (!logicalName) {
    throw new Error("logicalName property not found on object. This is needed in order to odataify the object.");
  }
  const metadata = metadataCache.entities[logicalName];

  if (metadata != null) {
    // Entity
    const entityMetadata = metadata as EntityWebApiMetadata;
    const entityValue = <IEntity>value;
    const output = Object.assign({}, entityValue);

    // Add the metadata type
    output["@odata.type"] = "Microsoft.Dynamics.CRM." + logicalName;

    // Remove attributes that are not needed in the OData payload
    delete output.id;
    delete output.logicalName;
    delete output.formattedValues;

    // Change the types for the odata payload
    odataifyFields(action, output, entityValue, entityMetadata);

    // Format the Odata ID
    switch (action) {
      case "Update":
        // Remove the primary key
        delete output[entityMetadata.primaryIdAttribute];
        break;
      case "Action":
        // The primary key must be odatified
        if (entityValue.id && entityValue.id) {
          output[`${entityMetadata.primaryIdAttribute}@odata.bind`] = `/${
            entityMetadata.collectionName
          }(${entityValue.id.toString()})`;
        }
        break;
    }

    return output;
  }

  // Action or Function
  const webApiMetdata = metadataCache.actions[logicalName];
  if (webApiMetdata) {
    // This is a web api action request
    const request = <WebApiExecuteRequest>value;

    const webApiRequest = new (class {
      getMetadata(): any {
        return webApiMetdata;
      }
    })();

    const requestOdata: WebApiExecuteRequest = Object.assign(webApiRequest, request) as WebApiExecuteRequest;
    // Get the parameters

    for (const field of Object.keys(requestOdata)) {
      if (field == "getMetadata" || field == "logicalName") continue;

      // odataify each field if it is an entity
      const fieldValue = requestOdata[field];

      // Get the type from the metadata
      const parameterMetadata = webApiMetdata.parameterTypes[field];
      if (parameterMetadata) {
        switch (parameterMetadata.structuralProperty) {
          case StructuralProperty.EnumerationType:
          case StructuralProperty.PrimitiveType:
            requestOdata[field] = fieldValue;
            break;
          case StructuralProperty.Collection:
            const collection = fieldValue as IEntity[];
            if (collection && collection.length > 0) {
              requestOdata[field] = odataify("Create", fieldValue);
            }

            break;
          case StructuralProperty.EntityType:
            // This is an entity record pointer
            const fieldValueAsEntityReference = fieldValue as EntityReference;
            const fieldValueAsEntity = fieldValue as IEntity;

            if (fieldValueAsEntityReference.entityType && fieldValueAsEntityReference.id) {
              // See https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/webapi/use-web-api-functions#pass-reference-to-an-entity-to-a-function

              requestOdata[field] = fieldValueAsEntityReference; //{'@odata.id':Entity.odatifyEntityReference(collectionName,fieldValueAsEntityReference.id)};
            } else if (fieldValueAsEntity.logicalName) {
              requestOdata[field] = odataify("Action", fieldValue);
            }

            break;

          case StructuralProperty.Unknown:
          default:
            throw new Error("Unknown parameter type on action.");
        }
      } else {
        throw new Error(`Unexpected parameter ${field} on execute Request`);
      }
    }

    delete requestOdata.logicalName;

    return requestOdata;
  }
}

function odataifyFields(
  action: "Create" | "Update" | "Action",
  output: IEntity,
  value: object | IEntity,
  metadata: EntityWebApiMetadata,
) {
  for (const field of Object.keys(output)) {
    const fieldType = Object.prototype.toString.call(output[field]);
    const fieldValue = output[field];
    switch (fieldType) {
      case "[object Array]":
        // Array of Activity Parties or enums
        // TODO: Add unit test for empty arrays
        const itemArray = fieldValue as any[];
        if (itemArray.length > 0) {
          // What is the type of the items
          const arrayType = itemArray[0].constructor.name;
          switch (arrayType) {
            case "Number":
              output[field] = itemArray.join(",");
              break;
            case "Object":
              // Is this an array of activity parties?
              const party = itemArray[0] as ActivityParty;

              if (party.partyid != null) {
                const activityPartiesField = `${metadata.logicalName}_activity_parties`;
                const activityParties: ActivityParty[] = [];
                if (output[activityPartiesField] == null) output[activityPartiesField] = activityParties;

                for (const item of itemArray) {
                  const webapiParty = odataify("Create", item);
                  activityParties.push(webapiParty);
                }
                // Remove the to/from/bcc/regarding field etc.
                delete output[field];
              }

              break;
          }
        } else output[field] = null;

        break;
      case "[object Object]":
        // Check if it's an EntityCollection
        if (Entity.containsFields(fieldValue, ["entities"])) {
          output[field] = odataify(action, (fieldValue as EntityCollection<IEntity>).entities);
        }

        // Create navigation properties for each entity reference
        // Check for entity reference
        else if (Entity.containsFields(fieldValue, ["id", "entityType"])) {
          const entityRef = fieldValue as EntityReference;
          let targetField = field;
          // If there are multiple navigation types, then convert to the correct field name by adding _<logicalname>
          const navigation = getNavigationProperty(field, metadata);

          if (navigation) {
            targetField = navigation.field;
            if (navigation.navigation.length > 1) {
              // This is a customer style field that has more than one target type
              targetField = targetField + "_" + entityRef.entityType;
            }
          }
          // Convert into odata navigation properties
          output[`${targetField}@odata.bind`] = Entity.getNavigationPathForEntityReference(value as IEntity, field);
          delete output[field];
        }
        break;
      case "[object Date]":
        // If the time element is set for Date Time fields - format accordingly
        const dateValue = fieldValue as Date;
        let dateString = dateValue.toJSON();
        // If the date field is DateOnly:DateOnly then trim the value to have no time
        if (dateString && (<Dictionary<string>>metadata.attributeTypes)[field] == "DateOnly:DateOnly") {
          dateString = dateString.substring(0, 10);
        }
        output[field] = dateString;
        break;
    }
  }
  return true;
}
function dateReviver(key: string, value: string) {
  if (typeof value === "string") {
    const a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
    if (a) {
      return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]));
    }
  }
  return value;
}
export async function sdkify<T>(
  value: any | Array<Record<string, any>>,
  logicalName?: string,
): Promise<T | EntityCollection<IEntity> | Xrm.RetrieveMultipleResult> {
  if (value.json) {
    // This is a UCI response object and we need to await the json converstion
    value = await value.json();
  }

  if (value.responseText) {
    // This is a raw execute response
    value = JSON.parse(value.responseText, dateReviver);
  }

  if ((<Xrm.RetrieveMultipleResult>value).entities != undefined) {
    return sdkifyEntityCollection<T>(value, logicalName);
  } else if (value.constructor.name == "Array") {
    return sdkifyArray<T>(value, logicalName);
  } else {
    return sdkifyEntity<T>(value as IEntity, logicalName);
  }
}
async function sdkifyEntity<T>(entityRecord: IEntity, logicalName?: string) {
  const entityMetadata = getEntityMetadataFromRecord(entityRecord, logicalName);

  if (entityMetadata != null) {
    // Formatted values hold the text labels
    entityRecord.formattedValues = entityRecord.formattedValues || {};
    let activityPartiesField: string | undefined;

    // Turn each complex type property into the sdk fields
    for (const field of Object.keys(entityRecord)) {
      const posAt = field.lastIndexOf("@");
      const containsAt = posAt > -1;
      const navigationProperty = field.endsWith("@Microsoft.Dynamics.CRM.lookuplogicalname");
      const underscore = field.startsWith("_");

      if ((!containsAt && !underscore) || navigationProperty) {
        let attributeValue: any = null;
        let attributeType: AttributeTypes = AttributeTypes.Unknown;
        let attributeLogicalName = field;
        const attributeNameWithoutAt = field.substr(0, posAt);

        /*
        We need to determine which type the field is here
        ---Dates---
        Dates we use the 'DateReviver' pattern 
        however this is very inefficient since it runs the regex on every field value

        ---EntityReference---
        Entity reference we can infer from the presence of the Microsoft.Dynamics.CRM.lookuplogicalname
        and Microsoft.Dynamics.CRM.associatednavigationproperty
        _parentcustomerid_value@Microsoft.Dynamics.CRM.associatednavigationproperty=parentcustomerid_account
        _parentcustomerid_value@Microsoft.Dynamics.CRM.lookuplogicalname=account
        _parentcustomerid_value@OData.Community.Display.V1.FormattedValue=xyz
                            
        _primarycontactid_value@Microsoft.Dynamics.CRM.associatednavigationproperty=primarycontactid
        _primarycontactid_value@Microsoft.Dynamics.CRM.lookuplogicalname=contact
        _primarycontactid_value@OData.Community.Display.V1.FormattedValue=xyz
        */
        if (navigationProperty) {
          attributeLogicalName = attributeNameWithoutAt;
        }

        const navigationPropertyName = attributeNameWithoutAt + "@Microsoft.Dynamics.CRM.associatednavigationproperty";
        const lookupLogicalName = attributeNameWithoutAt + "@Microsoft.Dynamics.CRM.lookuplogicalname";
        const formattedValueName = attributeLogicalName + "@OData.Community.Display.V1.FormattedValue";

        if (attributeLogicalName.endsWith("_activity_parties")) {
          attributeType = AttributeTypes.EntityCollection;
        } else if (navigationProperty && entityRecord[lookupLogicalName] != null) {
          attributeType = AttributeTypes.EntityReference;
        } else {
          let metadataType: string = entityMetadata.attributeTypes[field];
          // For DateTimes, trim off the second part
          metadataType = metadataType != null ? metadataType.split(":")[0] : "";
          // TODO: Match strings to the optionset names?
          switch (metadataType) {
            case "Optionset":
              attributeType = AttributeTypes.OptionSetValue;
              break;
            case "MultiSelect":
              attributeType = AttributeTypes.MultiSelectOptionSetValue;
              break;
            case "Money":
              attributeType = AttributeTypes.Money;
              break;
            case "DateOnly":
            case "DateAndTime":
              attributeType = AttributeTypes.DateTime;
              break;
            /*---Aliased Value---
            There doesn't seem to be any way of determining of a returned field value is an aliased value 
            This means that there is no way of determining the type from querying metadata.
            */
          }
        }

        // Add the formatted value if there is one
        if (entityRecord[formattedValueName] != null)
          entityRecord.formattedValues[attributeLogicalName] = entityRecord[formattedValueName];

        switch (attributeType) {
          case AttributeTypes.EntityReference:
            const entityType = entityRecord[lookupLogicalName] as string;
            attributeValue = {
              id: entityRecord[attributeLogicalName] as Guid,
              entityType: entityType as string,
              name: entityRecord[formattedValueName],
            } as EntityReference;

            // Get the attribute logical name
            const lookupAttributeName = entityRecord[navigationPropertyName] as string;
            if (attributeLogicalName.endsWith("_value") && attributeLogicalName.startsWith("_")) {
              attributeLogicalName = attributeLogicalName.substr(1, attributeLogicalName.length - "_value".length - 1);
            } else if (lookupAttributeName != null) {
              // Get the actual logical name of the attribute
              if (lookupAttributeName.endsWith("_" + entityType)) {
                const typePos = lookupAttributeName.lastIndexOf("_" + entityType);
                attributeLogicalName = lookupAttributeName.substr(0, typePos);
              } else {
                attributeLogicalName = lookupAttributeName;
              }
            }
            break;
          case AttributeTypes.Money:
            attributeValue = entityRecord[attributeLogicalName] as number;
            break;
          case AttributeTypes.MultiSelectOptionSetValue:
            attributeValue = entityRecord[attributeLogicalName];
            if (attributeValue != null) {
              const valueStrings: string[] = attributeValue.split(",");
              const valueInts: number[] = [];
              for (const v of valueStrings.reverse()) {
                valueInts.push(Number.parseInt(v));
              }
              attributeValue = valueInts;
            }
            if (entityRecord[formattedValueName] != null) {
              entityRecord.formattedValues[attributeLogicalName] = entityRecord[formattedValueName].split(";");
            }
            break;
          case AttributeTypes.OptionSetValue:
            attributeValue = entityRecord[attributeLogicalName];
            break;
          case AttributeTypes.EntityCollection:
            // Do we have the logical name of the relationship?
            let navigationLogicalName = "";
            if (field.endsWith("_activity_parties")) {
              navigationLogicalName = "activityparty";
              activityPartiesField = field;
            } else if ((<Dictionary<string[]>>entityMetadata.navigation)[field] != null) {
              navigationLogicalName = (<Dictionary<string[]>>entityMetadata.navigation)[field][0];
            }

            attributeValue = await sdkify(entityRecord[attributeLogicalName], navigationLogicalName);

            break;
          case AttributeTypes.DateTime:
            attributeValue = new Date(Date.parse(entityRecord[attributeLogicalName]));
            break;
          default:
            // Default - set primitive type value
            attributeValue = entityRecord[attributeLogicalName];
            break;
        }

        entityRecord[attributeLogicalName] = attributeValue;
      }
    }

    removeNonSdkFields(entityRecord);

    // If this is an activity party then populate the correct 'virtual field'
    if (activityPartiesField) {
      expandActivityPartiesToFields(entityRecord, activityPartiesField);
    }
  }
  entityRecord.logicalName = <string>logicalName;
  return (entityRecord as any) as T;
}
// Remove the fields not needed (@ and _ fields)
function removeNonSdkFields(entityRecord: IEntity) {
  for (const field of Object.keys(entityRecord)) {
    if (field.startsWith("_") || field.indexOf("@") > -1) {
      delete entityRecord[field];
    }
  }
}
// Expand out the activity party relationship array into to,from,bcc etc
function expandActivityPartiesToFields(entityRecord: IEntity, activityPartiesField: string) {
  // In the UCI the expand navigatiom property returns a promise!
  const parties = entityRecord[activityPartiesField] as IEntityCollection<ActivityParty>;

  let entities: ActivityParty[] = [];
  if (parties.entities) {
    entities = parties.entities;
  } else {
    entities = <ActivityParty[]>(<any>parties);
  }

  for (const a of entities) {
    let partyField = null;
    // Determine which field to add to
    switch (a.participationtypemask) {
      case activityparty_participationtypemask.BCC_Recipient:
        partyField = "bcc";
        break;
      case activityparty_participationtypemask.CC_Recipient:
        partyField = "cc";
        break;
      case activityparty_participationtypemask.Optional_attendee:
        partyField = "bcc";
        break;
      case activityparty_participationtypemask.Required_attendee:
        partyField = "requiredattendees";
        break;
      case activityparty_participationtypemask.Sender:
        partyField = "from";
        break;
      case activityparty_participationtypemask.To_Recipient:
        partyField = "to";
        break;
    }
    if (partyField != null) {
      let partyList = entityRecord[partyField];
      if (partyList == null) {
        partyList = [];
        entityRecord[partyField] = partyList;
      }
      partyList.push(a);
    }
  }
}
function getEntityMetadataFromRecord(entityRecord: IEntity, logicalName?: string) {
  let entityMetadata: EntityWebApiMetadata | WebApiExecuteRequestMetadata | null;
  const metadataCache = getMetadataCache();
  const actionPrefix = "Microsoft.Dynamics.CRM.";
  entityRecord.logicalName = entityRecord.logicalName || <string>logicalName; // allow passing the logical name rather than using the @odata.context
  if (entityRecord.logicalName == null) {
    // Get the @data.context to get the logical name
    // E.g. https://org.crm11.dynamics.com/api/data/v9.0/$metadata#accounts(name,parentaccountid)/$entity
    const odatacontext = entityRecord["@odata.context"] as string;
    const contextRegex = /\$metadata#([\w.]*)(\([\w()]*\))?(\/\$entity)?/g;
    const match = contextRegex.exec(odatacontext);
    if (match != null && match.length > 1) {
      const entitySetName = match[1];
      if (entitySetName.startsWith(actionPrefix)) {
        const actionName = entitySetName.substring(actionPrefix.length);
        entityMetadata = metadataCache.entities[actionName];
        if (entityMetadata != null) {
          entityRecord.logicalName = entityMetadata.logicalName;
        }
      } else {
        // Find the logical name from the entity set name
        entityMetadata = Entity.getMetadataFromEntitySet(entitySetName);
        entityRecord.logicalName = (<EntityWebApiMetadata>entityMetadata).logicalName;
      }
    } else {
      throw new Error("Cannot find the odata.context to get the logical name");
    }
  } else {
    // Get metadata
    entityMetadata = Entity.getMetadataByLogicalName(entityRecord.logicalName);
  }
  return entityMetadata;
}
async function sdkifyArray<T>(value: Record<string, any>[], logicalName?: string) {
  const cdsRecords: IEntity[] = [];
  for (const record of value as Array<IEntity>) {
    cdsRecords.push((await sdkify(record, logicalName)) as IEntity);
  }
  return new EntityCollection(cdsRecords);
}
async function sdkifyEntityCollection<T>(value: Record<string, any> | Record<string, any>[], logicalName?: string) {
  const response = <Xrm.RetrieveMultipleResult>value;
  const records = (await sdkifyArray(response.entities, logicalName)) as EntityCollection<IEntity>;
  records.pagingCooking = response.nextLink;
  return records;
}
export class EntityCollection<T extends IEntity> implements IEntityCollection<T> {
  entities: Array<T> = [];
  pagingCooking = "";

  constructor(entities: Array<T>) {
    this.entities = entities;
  }
}
export interface IEntityCollection<T extends IEntity> {
  entities: Array<T>;
  pagingCooking: string;
}
export function fixWebresourceXrm() {
  const metadata = getMetadataCache();
  const entNames: any = {};
  for (const entity in metadata.entitySetNames) {
    entNames[entity] = metadata.entitySetNames[entity];
  }
  const windowStatic: any = window;
  windowStatic.ENTITY_SET_NAMES = JSON.stringify(entNames);

  const primaryKeys: any = {};
  for (const entity in metadata.entities) {
    primaryKeys[entity] = metadata.entities[entity].primaryIdAttribute;
  }

  windowStatic.ENTITY_PRIMARY_KEYS = JSON.stringify(primaryKeys);
}

let webApiUrl = "";
export function getWebApiUrl() {
  let context: Xrm.GlobalContext;
  if (webApiUrl) return webApiUrl;

  if (window.GetGlobalContext) {
    context = window.GetGlobalContext();
  } else {
    if (window.Xrm) {
      context = window.Xrm.Page.context;
    } else {
      throw new Error("Context is not available.");
    }
  }
  const clientUrl = context.getClientUrl();

  const versionParts = context
    .getVersion()
    .toString()
    .split(".");

  webApiUrl = `${clientUrl}/api/data/v${versionParts[0]}.${versionParts[1]}`;
  // Add the WebApi version
  return webApiUrl;
}
export function getOdataContext() {
  return getWebApiUrl() + "/$metadata#$ref";
}
export function request(
  action: "POST" | "PATCH" | "PUT" | "GET" | "DELETE",
  uri: string,
  payload?: any,
  includeFormattedValues?: boolean,
  maxPageSize?: number,
) {
  // Construct a fully qualified URI if a relative URI is passed in.
  if (uri.charAt(0) === "/") {
    uri = getWebApiUrl() + uri;
  }

  return new Promise(function(resolve, reject) {
    const request = new XMLHttpRequest();
    request.open(action, encodeURI(uri), true);
    request.setRequestHeader("OData-MaxVersion", "4.0");
    request.setRequestHeader("OData-Version", "4.0");
    request.setRequestHeader("Accept", "application/json");
    request.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    if (maxPageSize) {
      request.setRequestHeader("Prefer", "odata.maxpagesize=" + maxPageSize);
    }
    if (includeFormattedValues) {
      request.setRequestHeader("Prefer", "odata.include-annotations=OData.Community.Display.V1.FormattedValue");
    }
    request.onreadystatechange = function() {
      if (this.readyState === 4) {
        request.onreadystatechange = null;
        switch (this.status) {
          case 200: // Success with content returned in response body.
          case 204: // Success with no content returned in response body.
            resolve(this);
            break;
          default:
            // All other statuses are unexpected so are treated like errors.
            let error: any;
            try {
              error = JSON.parse(request.response).error;
            } catch (e) {
              error = new Error("Unexpected Error");
            }
            reject(error);
            break;
        }
      }
    };
    request.send(JSON.stringify(payload));
  });
}
