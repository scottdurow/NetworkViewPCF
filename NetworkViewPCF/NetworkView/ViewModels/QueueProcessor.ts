/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { NetworkViewServiceProvider } from "../NetworkViewServiceProvider";
import { GraphSettings } from "./Config/GraphSettings";
import { RecordNode } from "./RecordNode";
import { RecordLink } from "./RecordLink";
import { PendingLink } from "./PendingLink";
import { EntitySetting } from "./Config/EntitySetting";
import {
  Dictionary,
  EntityReference,
  MetadataCache,
  EntityWebApiMetadata,
  setMetadataCache,
} from "../../Services/CdsSdk/CdsSdk";
import { JoinSettings } from "./Config/JoinSettings";
const MaxIterations = 50;
export class QueueProcessor {
  addEntityNodes: (entities: RecordNode[]) => boolean;
  addEntityLinks: (links: RecordLink[]) => boolean;
  onIterationCompleted: () => void;
  onProgress: (message: string) => void;
  onPaused: () => void;
  onError: (ex: Error) => void;
  cancelRequested = false;
  isPaused = false;
  nodeIndex: Dictionary<RecordNode> = {};
  iterations = 0;
  currentLoadIndex?: number;
  serviceProvider: NetworkViewServiceProvider;
  pendingLinks: PendingLink[] = [];
  rootIds: string[];
  rootLogicalName: string;
  settings: GraphSettings;
  queryCache: Dictionary<string> = {};
  entitySettingsIndex: Dictionary<EntitySetting> = {};
  constructor(settings: GraphSettings, serviceProvider: NetworkViewServiceProvider) {
    this.serviceProvider = serviceProvider;
    this.settings = settings;

    // Add connections
    if (this.settings.entities.find(a => a.loadConnections == true)) {
      this.settings.entities.push({
        logicalName: "connection",
        displayName: "Connection",
        collectionName: "connections",
        nameAttribute: "name",
        idAttribute: "connectionid",
        isIntersect: true,
        fetchXml: this.settings.connectionFetchXml as string,
      });
    }

    for (const setting of this.settings.entities) {
      this.entitySettingsIndex[setting.logicalName] = setting;
    }
    const metadata = {
      entitySetNames: {},
      actions: {},
      entities: {},
    } as MetadataCache;

    // Add the metadata from the configuration
    for (const entity of this.settings.entities) {
      metadata.entitySetNames[entity.logicalName] = entity.collectionName;
      metadata.entities[entity.logicalName] = {
        logicalName: entity.logicalName,
        collectionName: entity.collectionName,
        primaryIdAttribute: entity.idAttribute,
        attributeTypes: {},
      } as EntityWebApiMetadata;
    }

    setMetadataCache(metadata);
  }
  progressUpdate(message: string) {
    if (this.onProgress) {
      this.onProgress(message);
    }
  }
  setRoot(rootLogicalName: string, rootIds: string[]) {
    this.rootIds = rootIds;
    this.rootLogicalName = rootLogicalName;
  }

  indexNode(node: RecordNode) {
    const key = node.getKey();
    if (!this.nodeIndex[key]) {
      this.nodeIndex[key] = node;
      return true;
    }
    return false;
  }
  resumeLoad() {
    this.iterations = 0;
    this.isPaused = false;
  }
  getIndexedNode(loicalName: string, id: string) {
    const key = RecordNode.getKey(loicalName, id);
    if (this.nodeIndex[key]) {
      return this.nodeIndex[key];
    }
    return undefined;
  }
  async processQueue(): Promise<boolean> {
    let more = false;
    const links: RecordLink[] = [];
    const nodes: RecordNode[] = [];

    // If this is the first iteration, queue up the root nodes
    this.addRootLink();
    if (this.currentLoadIndex == undefined) return false;

    if (this.currentLoadIndex >= this.settings.entities.length) {
      // Reset to start
      this.currentLoadIndex = 0;
    }
    this.iterations++;

    const currentLoad = this.settings.entities[this.currentLoadIndex];

    console.group("Queue:" + this.iterations + " " + currentLoad.logicalName);
    this.currentLoadIndex++;
    if (this.iterations > MaxIterations) {
      this.progressUpdate("Paused due to maximum iterations reached");
      this.isPaused = true;
      if (this.onPaused) this.onPaused();
      return false;
    }

    try {
      this.progressUpdate(`${currentLoad.displayName}`);
      const records = await this.getRecords(currentLoad);
      const ids: string[] = [];
      if (records) {
        this.progressUpdate(`Loading ${currentLoad.displayName} (${records.entities?.length})`);
        console.debug(`Records ${records.entities.length}`);
        // Add entity nodes
        for (const record of records.entities) {
          if (this.cancelRequested) return false;
          // Add normal entity
          const idValue = record[currentLoad.idAttribute] as string;
          ids.push(idValue);
          const node = new RecordNode(idValue);
          node.settings = currentLoad;
          node.color = currentLoad.color;
          node.logicalName = record.logicalName;
          node.name = record[currentLoad.nameAttribute] as string;
          node.entityUrl = record["entityimage_url"] as string | undefined;
          if (!node.entityUrl && currentLoad.entityImageUrl) {
            node.entityUrl = currentLoad.entityImageUrl;
            node.isIconUrl = true;
          }
          node.data = record;
          if (currentLoad.showLabel == true) {
            node.label = node.name;
          }
          node.isRoot = this.rootIds.indexOf(idValue) > -1;
          if (this.indexNode(node) && currentLoad.isIntersect != true) {
            nodes.push(node);
          }
        }
      }
      const recordsFound = records && records.entities.length > 0;
      // Add in joins to pending Links (with source ids)
      if (currentLoad.joins && recordsFound) {
        for (const link of currentLoad.joins) {
          // only add if we have a setting for the entity
          // and if its a 1:N join
          const linkSettings = this.entitySettingsIndex[link.rightEntity];
          if (linkSettings) {
            this.addPendingLinkIds(link, ids);
          } else {
            console.warn(`Skipped entity link for '${link.rightEntity}'' because it is not in the settings`);
          }
        }
      }

      if (currentLoad.loadConnections) {
        const connectionLink = {
          leftEntity: currentLoad.logicalName,
          leftAttribute: currentLoad.idAttribute,
          rightEntity: "connection",
          leftIntersectAttribute: "record1id",
          rightAttribute: "record2id",
        } as JoinSettings;
        this.addPendingLinkIds(connectionLink, ids);
      }

      // Process Links
      const pendingLinks = this.getPendingIds(currentLoad.logicalName);
      for (const link of pendingLinks) {
        if (this.cancelRequested) return false;
        if (link.linkSettings.leftAttribute == "") {
          // Root link
          link.targetids = [];
        } else {
          // Check links to nodes just loaded
          this.processLink(ids, link, links);
        }
      }
      for (const link of pendingLinks) {
        this.removePendingLink(link);
      }

      this.addEntityNodes(nodes);
      this.addEntityLinks(links);

      const endOfIteration = this.currentLoadIndex >= this.settings.entities.length;

      more = this.pendingLinks.length > 0;
      if (endOfIteration || !more) {
        this.onIterationCompleted();
      }
    } catch (ex) {
      console.debug(ex);
      if (this.onError) this.onError(ex);
    }
    console.groupEnd();
    return more;
  }
  private addRootLink() {
    if (!this.currentLoadIndex) {
      // Add the pending links for the root
      this.currentLoadIndex = this.settings.entities.findIndex(s => s.logicalName == this.rootLogicalName);
      if (this.currentLoadIndex == -1) throw new Error(`Cannot find entity ${this.rootLogicalName}`);
      const rootSettings = this.settings.entities[this.currentLoadIndex];
      const link = new PendingLink(
        {
          leftAttribute: "",
          rightAttribute: rootSettings.idAttribute,
          leftEntity: rootSettings.logicalName,
          rightEntity: rootSettings.logicalName,
          hierarchical: rootSettings.hierarchical,
        } as JoinSettings,
        this.rootIds,
      );
      this.addPendingLink(link);
    }
  }

  private processLink(ids: string[], link: PendingLink, links: RecordLink[]) {
    const pendingIds: string[] = [];
    const idsToProcess = link.intersectIds || ids;
    for (const id of idsToProcess) {
      const node = this.getIndexedNode(link.linkSettings.rightEntity, id);
      if (node) {
        let missingLink = false;
        const linkNode = new RecordLink("");
        linkNode.source = node;
        const lookupValue =
          node.data &&
          (node.data[link.linkSettings.leftIntersectAttribute || link.linkSettings.rightAttribute] as EntityReference);
        if (
          lookupValue &&
          lookupValue.id &&
          lookupValue.entityType &&
          lookupValue.entityType == link.linkSettings.leftEntity
        ) {
          const linkedNode = this.getIndexedNode(lookupValue.entityType, lookupValue.id);
          missingLink = !linkedNode;
          if (linkedNode) {
            linkNode.target = linkedNode;
            // Check the source - if this is an intersect then get the left node
            // TODO: Not pretty!
            if (link.linkSettings.leftIntersectAttribute) {
              const leftAttribute = link.linkSettings.rightAttribute;
              if (leftAttribute && node.data) {
                const leftLookup = node.data[leftAttribute] as EntityReference | string;
                const leftLookupEntityReferenceId = leftLookup && (leftLookup as EntityReference).id;
                const LeftLookupId = leftLookupEntityReferenceId || (leftLookup as string);
                const leftLookupLogicalName = leftLookupEntityReferenceId
                  ? (leftLookup as EntityReference).entityType
                  : link.linkSettings.rightEntity;
                if (LeftLookupId && leftLookupLogicalName) {
                  const leftNode = this.getIndexedNode(leftLookupLogicalName, LeftLookupId as string);
                  if (leftNode) {
                    linkNode.source = leftNode;
                    linkNode.target = linkedNode;
                    linkNode.linkType = "n:n";
                    linkNode.intersect = node;
                  }
                  missingLink = !leftNode;
                }
              }
            }

            if (link.linkSettings.isParent) {
              linkNode.linkType = "parent";
              linkNode.directional = true;
            }
            if (!missingLink && linkNode.source && linkNode.target) {
              links.push(linkNode);
            }
          }

          if (missingLink == true && node.data) {
            // There is a link to a record that hasn't been loaded
            // So add a pending link for the next iteration to load
            const linkSettings = JSON.parse(JSON.stringify(link.linkSettings)) as JoinSettings;
            if (link.linkSettings.leftIntersectAttribute) {
              const lookup = node.data[link.linkSettings.leftIntersectAttribute] as EntityReference;
              if (lookup && lookup.entityType) {
                linkSettings.leftEntity = lookup.entityType;
                const entitysettings = this.entitySettingsIndex[lookup.entityType];
                linkSettings.leftAttribute = entitysettings.idAttribute;
              }
            }
            const missingLink = new PendingLink(linkSettings, [lookupValue.id], node);
            missingLink.backLink = true;
            missingLink.intersectIds = [id];
            this.addPendingLink(missingLink);

            pendingIds.push(id);
          }
        }
      }
    }
    link.targetids = [];
  }
  addPendingLinkIds(link: JoinSettings, ids: string[]) {
    const pendingLink = new PendingLink(link, ids);
    this.pendingLinks.push(pendingLink);
  }
  addPendingLink(link: PendingLink) {
    this.pendingLinks.push(link);
  }
  removePendingLink(link: PendingLink) {
    const index = this.pendingLinks.indexOf(link);
    if (index > -1) {
      this.pendingLinks.splice(index, 1);
    }
  }
  getPendingIds(entityLogicalName: string): PendingLink[] {
    const links = this.pendingLinks.filter(
      a =>
        (a.backLink == true && a.linkSettings.leftEntity == entityLogicalName) ||
        a.linkSettings.rightEntity == entityLogicalName,
    );
    return links;
  }
  async getRecords(load: EntitySetting) {
    let idCondition = "<filter type='or'>";
    let idAdded = false;
    const links = this.getPendingIds(load.logicalName);

    if (links && links.length > 0) {
      for (const link of links) {
        const conditionAttribute =
          link.backLink == true ? link.linkSettings.leftAttribute : link.linkSettings.rightAttribute;
        const idConditionPart = this.getIdCondition(
          link.targetids,
          load.logicalName,
          conditionAttribute,
          link.linkSettings.hierarchical == true,
        );

        idCondition += idConditionPart;
        idAdded = idAdded || idConditionPart.length > 0;
      }
    }

    idCondition += "</filter>";

    if (idAdded) {
      const fetchXml = load.fetchXml?.replace("{0}", idCondition);
      console.debug(fetchXml);
      const webApiService = this.serviceProvider.GetServiceClient();
      const records = await webApiService.retrieveMultiple(fetchXml);
      return records;
    } else return undefined;
  }
  getIdCondition(ids: string[], logicalName: string, attributeName: string, hierachical: boolean) {
    let idCondition = "";
    if (hierachical) {
      for (const id of ids) {
        const key = logicalName + "." + attributeName + "-under-above-" + id;
        if (!this.queryCache[key]) {
          console.debug(key);
          idCondition += `<condition attribute='${attributeName}' operator='eq-or-above' value='${id}'/>`;
          idCondition += `<condition attribute='${attributeName}' operator='under' value='${id}'/>`;
          this.queryCache[key] = key;
        }
      }
    } else {
      for (const id of ids) {
        const key = logicalName + "." + attributeName + "-eq-" + id;

        if (!this.queryCache[key]) {
          console.debug(key);
          idCondition += `<condition attribute='${attributeName}' operator='eq' value='${id}'/>`;
          this.queryCache[key] = key;
        }
      }
    }

    return idCondition;
  }
}
