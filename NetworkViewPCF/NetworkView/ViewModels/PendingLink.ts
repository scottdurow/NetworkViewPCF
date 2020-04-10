import { RecordNode } from "./RecordNode";
import { JoinSettings } from "./Config/JoinSettings";

export class PendingLink {
  constructor(joinSettings: JoinSettings, ids: string[], source?: RecordNode) {
    this.linkSettings = joinSettings;
    this.targetids = ids;
    this.source = source;
  }
  backLink?: boolean;
  source?: RecordNode;
  targetids: string[];
  intersectIds?: string[];
  linkSettings: JoinSettings;
}
