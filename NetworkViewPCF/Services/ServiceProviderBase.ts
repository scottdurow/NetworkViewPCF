/* eslint-disable @typescript-eslint/no-explicit-any */
import { ControlContextService } from "./BaseServices/ControlContextService";
import { DialogService } from "./BaseServices/DialogService";
import { PCFDialogService } from "./PCFServices/PCFDialogService";
import { CdsServiceClient } from "./CdsSdk/CdsServiceClient";
import { PCFControlContextService } from "./PCFServices/PCFControlContextService";
import { XrmContextCdsServiceClient } from "./CdsSdk/XrmContextCdsServiceClient";

export class ServiceProviderBase {
  controlContextService!: ControlContextService;
  dialogService!: DialogService;
  serviceClient!: CdsServiceClient;
  context: ComponentFramework.Context<unknown> | undefined;
  constructor(context: ComponentFramework.Context<unknown>) {
    this.context = context;
    this.dialogService = new PCFDialogService(context);
    this.controlContextService = new PCFControlContextService(context);
    this.serviceClient = new XrmContextCdsServiceClient((context.webAPI as any) as Xrm.WebApi);
  }
  GetControlContextService(): ControlContextService {
    return this.controlContextService;
  }
  GetDialogService(): DialogService {
    return this.dialogService;
  }
  GetServiceClient(): CdsServiceClient {
    return this.serviceClient;
  }
}
