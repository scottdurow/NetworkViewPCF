import { RecordNode } from "./RecordNode";

export class RecordLink {
  source: RecordNode | string;
  target: RecordNode | string;
  id: string;
  directional?: boolean;
  linkType?: "n:n" | "1:n" | "regarding" | "parent";
  linkEntity?: string;
  lookupAttribute?: string;
  otherLinks: RecordLink[] = [];
  intersect?: RecordNode;
  constructor(id: string) {
    this.id = id;
  }
  getIntersectAttribute<T>(attributeLogicalName: string): T | undefined {
    let value: T | undefined;

    if (this.intersect && this.intersect.data) {
      value = this.intersect.data[attributeLogicalName] as T | undefined;
    }
    return value;
  }
}
