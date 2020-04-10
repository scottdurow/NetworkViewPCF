/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { LinkObject, NodeObject, GraphData } from "force-graph";
import { decorate, observable, action } from "mobx";
import { IPoint } from "office-ui-fabric-react/lib/utilities/positioning";
import { RecordNode } from "./RecordNode";
import { RecordLink } from "./RecordLink";
import { NetworkViewServiceProvider } from "../NetworkViewServiceProvider";
import { Dictionary, EntityReference } from "../../Services/CdsSdk/CdsSdk";
import { UserOrTeam } from "./User";
import { ConnectionRole } from "./ConnectionRole";
import { QueueProcessor } from "./QueueProcessor";
import { defaultConfig } from "./DefaultConfig";
import { GraphSettings } from "./Config/GraphSettings";
import { IInputs } from "../generated/ManifestTypes";

export class NetworkViewModel {
  serviceProvider: NetworkViewServiceProvider;
  zoom = 1;
  data: GraphData;
  currentNode?: RecordNode | null;
  currentLink?: RecordLink | null;
  calloutTarget?: IPoint;
  mouseX: number;
  mouseY: number;
  progressText?: string;
  isLoading = false;
  isPaused = false;
  fullScreen = false;
  users: UserOrTeam[] = [];
  connectionRoles: ConnectionRole[] = [];
  rootEntityIds: string[] = [];
  rootEntityLogicalname: string;
  queueProcessor: QueueProcessor;
  onZoomToFitRequested: () => void;
  settings: GraphSettings = defaultConfig;
  linkCache: Dictionary<RecordLink> = {};
  errorText: string;
  cancelRequested = false;

  constructor(serviceProvider: NetworkViewServiceProvider) {
    // Create a copy of the settins
    const settings = JSON.stringify(defaultConfig);
    this.serviceProvider = serviceProvider;
    this.serviceProvider.GetControlContextService().subscribeToOnLoad(this.onLoad);
    this.serviceProvider.GetControlContextService().subscribeToOnSave(this.onLoad);
  }
  async onLoad() {
    if (fetch) {
      try {
        const configPath = this.serviceProvider.GetControlContextService().getParameters<IInputs>()
          .configWebresourcePath;
        if (configPath && configPath.raw) {
          console.debug(`Loading config from [${configPath.raw}]`);
          const response = await fetch(configPath.raw);
          if (response.ok) {
            const settingsJs = await response.text();
            const configFunction = Function(settingsJs);
            this.settings = configFunction();
          }
        }
      } catch (ex) {
        console.error(ex);
      }
    }

    await this.init();
  }
  onPaused = () => {
    this.isPaused = true;
  };
  onError = (ex: Error) => {
    this.errorText = ex.message;
  };
  addEntityNode = (entity: RecordNode[]): boolean => {
    this.data.nodes = [...this.data.nodes, ...entity];
    return true;
  };
  addEntityLink = (links: RecordLink[]): boolean => {
    // Check it doesn't already exist
    const linksToAdd: RecordLink[] = [];
    for (const link of links) {
      let source = link.source as RecordNode;
      let target = link.target as RecordNode;
      if (source.id < target.id) {
        const sourceSwap = source;
        source = target;
        target = sourceSwap;
      }
      const key = source.logicalName + "_" + source.id + "_" + target.logicalName + "_" + target.id;
      const existing = this.linkCache[key];
      if (!existing) {
        linksToAdd.push(link);
        this.linkCache[key] = link;
        console.debug("New link " + key);
      } else {
        console.debug("Existing link " + key);
        let addOther = false;
        if (existing.intersect && link.intersect) {
          // check that the insersect doesn't already exist already
          // E.g. Connections will be discovered from both sides
          // Also - they have a reciprical connection
          const allLinks: RecordLink[] = [existing, ...existing.otherLinks];
          const linkId = link.intersect.id;
          const existsInOthers = allLinks.find(
            a =>
              a.intersect?.id == linkId ||
              a.getIntersectAttribute<EntityReference>("relatedconnectionid")?.id == linkId,
          );
          addOther = !existsInOthers;
        } else {
          // Check that the link is unique
          addOther = existing.linkType != link.linkType;
        }
        if (addOther) {
          existing.otherLinks.push(link);
        }
      }
    }

    this.data.links = [...this.data.links, ...linksToAdd];
    return true;
  };
  onIterationCompleted = () => {
    this.onNodesChanged();
  };
  onProgress = (message: string) => {
    this.progressText = message;
  };
  toggleFullScreen(): void {
    this.fullScreen = !this.fullScreen;
    this.serviceProvider.GetControlContextService().fullScreen(this.fullScreen);
  }
  requestCancelLoad() {
    this.cancelRequested = true;
    this.queueProcessor.cancelRequested = true;
  }
  resumeLoad() {
    this.queueProcessor.resumeLoad();
    this.isLoading = true;
    this.isPaused = false;
    this.tick();
  }

  async init(): Promise<void> {
    // Initialise the QueryProcessor with the loaded or default settings
    const settings = JSON.stringify(this.settings);
    this.queueProcessor = new QueueProcessor(JSON.parse(settings), this.serviceProvider);
    this.queueProcessor.addEntityNodes = this.addEntityNode;
    this.queueProcessor.addEntityLinks = this.addEntityLink;
    this.queueProcessor.onIterationCompleted = this.onIterationCompleted;
    this.queueProcessor.onProgress = this.onProgress;
    this.queueProcessor.onPaused = this.onPaused;
    this.queueProcessor.onError = this.onError;

    this.data = {
      nodes: [],
      links: [],
    };

    const primaryId = this.serviceProvider.GetControlContextService().getPrimaryId();
    if (primaryId.id && primaryId.entityType) {
      this.rootEntityIds = [primaryId.id];
      this.rootEntityLogicalname = primaryId.entityType;
      this.queueProcessor.setRoot(this.rootEntityLogicalname, this.rootEntityIds);
      this.isLoading = true;
      await this.tick();
    }
  }
  async tick() {
    const more = await this.queueProcessor.processQueue();

    if (more) {
      setTimeout(async () => {
        await this.tick();
        if (this.onZoomToFitRequested) this.onZoomToFitRequested();
      }, 10);
    } else {
      this.isLoading = false;
      setTimeout(() => {
        if (this.onZoomToFitRequested) this.onZoomToFitRequested();
      }, 1000);
    }
  }
  addTestNodes() {
    if (!this.data) {
      this.data = {
        nodes: [],
        links: [],
      } as GraphData;

      const account1 = this.createNodeWithActivities();
      const account2 = this.createNodeWithActivities();
      const account3 = this.createNodeWithActivities();
      const account4 = this.createNodeWithActivities();
      const link1 = this.addLink(account1, account2, true, false);
      const link2 = this.addLink(account1, account3, true, false);
      const link3 = this.addLink(account1, account4, true, false);
    } else {
      const len = this.data.nodes.length;
      const lastNode = this.data.nodes[len - 1] as RecordNode;
      lastNode.groupedNodes = lastNode.groupedNodes || [];

      const newNode = new RecordNode(len.toString());
      newNode.x = lastNode.x;
      newNode.y = lastNode.y;
      lastNode.groupedNodes.push(newNode);
    }

    setTimeout(() => {
      this.addTestNodes();
    }, 1000);
  }
  createNodeWithActivities() {
    const nodeCount = this.data.nodes ? this.data.nodes.length : 0;
    const node = this.addNode(`Account ${nodeCount}`);

    for (let i = 1; i < 5; i++) {
      this.addLink(node, this.addNode("Activity"), false, true);
    }
    return node;
  }
  onNodesChanged() {
    this.data = {
      nodes: [...this.data.nodes],
      links: [...this.data.links],
    };
  }
  addNodeLink(newNode: RecordNode[], newLink: RecordLink[]): void {
    this.data = {
      nodes: [...this.data.nodes, ...newNode],
      links: [...this.data.links, ...newLink],
    };
  }
  addNode(name: string) {
    const nodeCount = this.data.nodes ? this.data.nodes.length : 0;
    const node = new RecordNode(nodeCount.toString());
    node.name = name;
    this.data.nodes.push(node);
    return node;
  }
  addLink(node1: RecordNode, node2: RecordNode, directional: boolean, isRegarding: boolean) {
    const linkCount = this.data.links ? this.data.links.length : 0;
    const link = new RecordLink(linkCount.toString());
    link.directional = directional;
    link.source = node1;
    link.target = node2;
    if (isRegarding) link.linkType = "regarding";

    this.data.links.push(link);
    return link;
  }
  onHoverNode(
    node: NodeObject | null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    previousNode: NodeObject | null,
  ): void {
    this.currentNode = node as RecordNode;
    if (node) {
      const calloutX = this.mouseX;
      const calloutY = this.mouseY + 8 * this.zoom;
      this.calloutTarget = { x: calloutX, y: calloutY };
    } else {
      this.calloutTarget = undefined;
    }
  }
  onNodeClick(node: NodeObject): void {}
  onNodeDoubleClick(node: RecordNode): void {
    const newNodes: RecordNode[] = [];
    const newLinks: RecordLink[] = [];

    if (node.groupedNodes) {
      let i = this.data.nodes.length;
      // Add the group nodes
      for (const newNode of node.groupedNodes) {
        i++;
        newNode.x = node.x;
        newNode.y = node.y;
        newNode.id = i.toString();

        const newLink = this.addLink(node, newNode, false, true);
        newNodes.push(newNode);
        newLinks.push(newLink);
      }

      node.groupedNodes = undefined;
    }

    this.addNodeLink(newNodes, newLinks);
  }
  onHoverLink(link: LinkObject | null): void {
    // Highlight link
    this.currentLink = link as RecordLink;

    const calloutX = this.mouseX;
    const calloutY = this.mouseY + 8 * this.zoom;
    this.calloutTarget = { x: calloutX, y: calloutY };
  }
}

decorate(NetworkViewModel, {
  data: observable,
  zoom: observable,
  currentNode: observable,
  currentLink: observable,
  calloutTarget: observable,
  onProgress: action,
  progressText: observable,
  isLoading: observable,
  isPaused: observable,
  toggleFullScreen: action,
  users: observable,
  connectionRoles: observable,
  cancelRequested: observable,
  errorText: observable,
  onLoad: action.bound,
});
