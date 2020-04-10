/* eslint-disable @typescript-eslint/no-unused-vars */
export class MockDataset implements ComponentFramework.PropertyTypes.DataSet {
  paging: ComponentFramework.PropertyHelper.DataSetApi.Paging;
  addColumn?: ((name: string, entityAlias?: string | undefined) => void) | undefined;
  columns: ComponentFramework.PropertyHelper.DataSetApi.Column[];
  error: boolean;
  errorMessage: string;
  filtering: ComponentFramework.PropertyHelper.DataSetApi.Filtering;
  linking: ComponentFramework.PropertyHelper.DataSetApi.Linking;
  loading: boolean;
  records: { [id: string]: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord };
  sortedRecordIds: string[];
  sorting: ComponentFramework.PropertyHelper.DataSetApi.SortStatus[];
  clearSelectedRecordIds(): void {
    throw new Error("Method not implemented.");
  }
  getSelectedRecordIds(): string[] {
    throw new Error("Method not implemented.");
  }
  getTargetEntityType(): string {
    throw new Error("Method not implemented.");
  }
  getTitle(): string {
    throw new Error("Method not implemented.");
  }
  getViewId(): string {
    throw new Error("Method not implemented.");
  }
  openDatasetItem(entityReference: ComponentFramework.EntityReference): void {
    throw new Error("Method not implemented.");
  }
  refresh(): void {
    throw new Error("Method not implemented.");
  }
  setSelectedRecordIds(ids: string[]): void {
    throw new Error("Method not implemented.");
  }
}
