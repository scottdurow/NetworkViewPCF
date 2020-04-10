export interface JoinSettings {
  leftEntity: string;
  rightEntity: string;
  leftAttribute: string;
  leftIntersectAttribute?: string;
  rightAttribute: string;
  rightIntersectAttribute?: string;
  isParent?: boolean;
  hierarchical?: boolean;
  nameAttribute?: string;
  name?: string;
  excludeIds?: string[];
}
