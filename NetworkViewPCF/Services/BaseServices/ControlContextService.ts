/* eslint-disable @typescript-eslint/no-unused-vars */
import { EntityReference } from "../CdsSdk/CdsSdk";

export class ControlContextService {
  loaded = false;
  onRecordsLoaded!: (data: ComponentFramework.PropertyTypes.DataSet, firstPage: boolean) => void;
  onLoadEvent: () => Promise<void>;
  onParametersChangedHandler: (readonly: boolean) => Promise<void> | void;
  onSaveEventHandler: () => void;
  onFullScreenCloseHandler: () => Promise<void> | void;
  getParameters<T>(): T {
    throw new Error("Method not implemented.");
  }
  onPCFUpdate(context: ComponentFramework.Context<unknown>, updatedProperties: string[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getPrimaryId(): EntityReference {
    throw new Error("Method not implemented.");
  }
  subscribeToOnLoad(onLoadEvent: () => Promise<void>): void {
    this.onLoadEvent = onLoadEvent;
  }
  notifyOnLoad(): void {
    if (this.onLoadEvent && !this.loaded) {
      this.loaded = true;
      const task = this.onLoadEvent();
      task.then(() => {
        this.loaded = true;
      });
    }
  }

  notifyOnSave(): void {
    if (this.onSaveEventHandler) {
      this.onSaveEventHandler();
    }
  }

  notifyOnClosed(): void {
    if (this.onFullScreenCloseHandler) {
      this.onFullScreenCloseHandler();
    }
  }

  subscribeToOnChange(
    attributes: string[],
    OnTemplateDataChanged: (fieldName: string, value: ComponentFramework.PropertyTypes.Property) => void,
  ): void {
    throw new Error("Method not implemented.");
  }

  subscribeToParametersChanged(onChangeEvent: (readonly: boolean) => void): void {
    this.onParametersChangedHandler = onChangeEvent;
  }
  subscribeToOnSave(onSaveEventHandler: () => void): void {
    this.onSaveEventHandler = onSaveEventHandler;
  }
  subscribeToOnFullScreenClose(onFullScreenCloseHandler: () => Promise<void> | void): void {
    this.onFullScreenCloseHandler = onFullScreenCloseHandler;
  }
  getIsControlReadOnly(): boolean {
    throw new Error("Method not implemented.");
  }
  saveFormData(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  formatNumber(value: number | undefined): string {
    throw new Error("Method not implemented.");
  }
  formatTime(value: Date | undefined, formatType: "date" | "time" | "datetime"): string | undefined {
    throw new Error("Method not implemented.");
  }
  convertDate(value: Date, convertTo: "utc" | "local"): Date {
    throw new Error("Method not implemented.");
  }
  closeForm(): void {
    throw new Error("Method not implemented.");
  }
  fullScreen(fullscreen: boolean): void {
    throw new Error("Method not implemented.");
  }
  lookupRecords(
    defaultEntityLogicalName: string,
    entityLogicalNames: string[],
    allowMultiple: boolean,
  ): Promise<EntityReference[]> {
    throw new Error("Method not implemented.");
  }

  // Dataset related methods
  subscribeToRecordsLoaded(
    onRecordsLoaded: (data: ComponentFramework.PropertyTypes.DataSet, firstPage: boolean) => void,
  ): void {
    this.onRecordsLoaded = onRecordsLoaded;
  }
  notifyRecordsLoaded(data: ComponentFramework.PropertyTypes.DataSet, firstPage: boolean): void {
    if (this.onRecordsLoaded) {
      this.onRecordsLoaded(data, firstPage);
    }
  }
  refreshDataset(): void {
    throw new Error("Method not implemented.");
  }
  requestNextPage(): void {
    throw new Error("Method not implemented.");
  }
  applyFilter(
    filter?: ComponentFramework.PropertyHelper.DataSetApi.FilterExpression,
    linking?: ComponentFramework.PropertyHelper.DataSetApi.LinkEntityExposedExpression[],
  ): void {
    throw new Error("Method not implemented.");
  }
  applySort(sort: { name: string; sortDirection: number }[], refresh?: boolean): void {
    throw new Error("Method not implemented.");
  }
  getSort(): ComponentFramework.PropertyHelper.DataSetApi.SortStatus[] {
    throw new Error("Method not implemented.");
  }
  getColumns(): ComponentFramework.PropertyHelper.DataSetApi.Column[] {
    throw new Error("Method not implemented.");
  }
  setSelectedRecords(selectedIDs: string[]): void {
    throw new Error("Method not implemented.");
  }
}
