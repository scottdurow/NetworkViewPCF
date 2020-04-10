import { JoinSettings } from "./JoinSettings";

export interface EntitySetting {
  displayName?: string;
  logicalName: string;
  collectionName: string;
  nameAttribute: string;
  idAttribute: string;
  fetchXml: string;
  parentAttributeId?: string;
  loadActivities?: boolean;
  loadConnections?: boolean;
  hierarchical?: boolean;
  entityImageUrl?: string;
  isIntersect?: boolean;
  color?: string;
  joins?: JoinSettings[];
  showLabel?:boolean;
}
