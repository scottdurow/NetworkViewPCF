/* eslint-disable @typescript-eslint/no-unused-vars */
export class MockPaging implements ComponentFramework.PropertyHelper.DataSetApi.Paging {
  totalResultCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  loadNextPage(): void {
    throw new Error("Method not implemented.");
  }
  loadPreviousPage(): void {
    throw new Error("Method not implemented.");
  }
  reset(): void {
    throw new Error("Method not implemented.");
  }
  setPageSize(pageSize: number): void {
    throw new Error("Method not implemented.");
  }
}
