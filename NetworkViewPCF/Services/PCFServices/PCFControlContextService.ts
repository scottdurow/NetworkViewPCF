/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ControlContextService } from "../BaseServices/ControlContextService";
import { EntityReference, sdkify, EntityCollection, Entity, Dictionary } from "../CdsSdk/CdsSdk";

export class PCFControlContextService extends ControlContextService {
  context: ComponentFramework.Context<unknown>;
  parameters: Dictionary<unknown> = {};
  constructor(context: ComponentFramework.Context<unknown>) {
    super();
    this.context = context;
  }
  getPrimaryId(): EntityReference {
    const formContext = this.getFormContext();
    return new EntityReference(formContext.mode.contextInfo.entityTypeName, formContext.mode.contextInfo.entityId);
  }
  fullScreen(fullscreen: boolean): void {
    this.context.mode.setFullScreen(fullscreen);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getFormContext(): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.context as any;
  }

  async onPCFUpdate(context: ComponentFramework.Context<unknown>, updatedProperties: string[]): Promise<void> {
    console.debug("PCF Update " + JSON.stringify(updatedProperties));

    this.parameters = this.context.parameters as Dictionary<unknown>;

    for (const field of updatedProperties) {
      // Parameters is passed when control is enabled/disabled etc.
      switch (field) {
        case "layout":
          this.notifyOnLoad();
          break;
        case "parameters":
          if (this.onParametersChangedHandler) {
            await this.onParametersChangedHandler(this.getIsControlReadOnly());
          }
          break;
        case "entityId":
          // This means the form has been saved so notify
          if (this.onSaveEventHandler) {
            await this.onSaveEventHandler();
          }
          break;
        case "fullscreen_close":
          if (this.onFullScreenCloseHandler) await this.onFullScreenCloseHandler();
          break;
      }
    }
  }

  getParameters<T>() {
    return (this.parameters as unknown) as T;
  }
}
