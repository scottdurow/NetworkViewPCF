import { ControlContextService } from "./ControlContextService";
import { DialogService } from "./DialogService";
import { CdsServiceClient } from "../CdsSdk/CdsServiceClient";

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export class ServiceProvider {
  GetControlContextService(): ControlContextService {
    throw new Error("Method not implemented.");
  }
  GetDialogService(): DialogService {
    throw new Error("Method not implemented.");
  }
  GetServiceClient(): CdsServiceClient {
    throw new Error("Method not implemented.");
  }
}
