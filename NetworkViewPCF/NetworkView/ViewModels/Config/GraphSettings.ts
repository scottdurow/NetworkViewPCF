import { Dictionary } from "../../../Services/CdsSdk/CdsSdk";
import { EntitySetting } from "./EntitySetting";

export interface GraphSettings {
  iterationCountPerLoad?: number;
  trace?: boolean;
  demoTickLength?: number;
  femoModeInitialState?: boolean;
  acitvityFetchXml?: string;
  connectionFetchXml?: string;
  entities: EntitySetting[];
  //quickViewForms : Dictionary<Dictionary<string>>();
}
