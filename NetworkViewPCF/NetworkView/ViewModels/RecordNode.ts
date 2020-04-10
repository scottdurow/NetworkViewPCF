/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { NodeObject } from "force-graph";
import { IEntity } from "../../Services/CdsSdk/CdsSdk";
import { EntitySetting } from "./Config/EntitySetting";

export class RecordNode implements NodeObject {
  settings: EntitySetting;
  x: number;
  y: number;
  index: number;
  name?: string | undefined;
  isRoot?: boolean;
  entityUrl?: string;
  data?: IEntity;
  id: string;
  logicalName?: string;
  label?: string;
  showLabelOnHover?: boolean;
  groupedNodes?: RecordNode[];
  isIconUrl?: boolean;
  color?: string;
  constructor(id: string) {
    this.id = id;
  }
  getKey() {
    return RecordNode.getKey(this.logicalName as string, this.id);
  }
  static getKey(logicalName: string, id: string) {
    return logicalName + id;
  }
  getAttribute<T>(attributeLogicalName: string): T | undefined {
    let value: T | undefined;

    if (this.data) {
      value = this.data[attributeLogicalName] as T | undefined;
    }
    return value;
  }
}
