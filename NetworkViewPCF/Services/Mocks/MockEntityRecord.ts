/* eslint-disable @typescript-eslint/no-unused-vars */
export class MockEntityRecord implements ComponentFramework.PropertyHelper.DataSetApi.EntityRecord {
  getFormattedValue(columnName: string): string {
    throw new Error("Method not implemented.");
  }
  getRecordId(): string {
    throw new Error("Method not implemented.");
  }
  getValue(
    columnName: string,
  ):
    | string
    | number
    | boolean
    | Date
    | number[]
    | ComponentFramework.EntityReference
    | ComponentFramework.EntityReference[] {
    throw new Error("Method not implemented.");
  }
  getNamedReference(): ComponentFramework.EntityReference {
    throw new Error("Method not implemented.");
  }
}
