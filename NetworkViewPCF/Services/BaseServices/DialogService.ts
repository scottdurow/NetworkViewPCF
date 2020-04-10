/* eslint-disable @typescript-eslint/no-unused-vars */
export class DialogService {
  isOpen: boolean;
  message: string;
  title: string;
  progressOpen: boolean;
  openRecord(loicalName: string, id: string): void {
    throw new Error("Method not implemented.");
  }
  openNewWindow(url: string): void {
    throw new Error("Method not implemented.");
  }
  showErrorDialog(ex: Error): void {
    throw new Error("Method not implemented.");
  }
  showProgressDialog(message: string): void {
    throw new Error("Method not implemented.");
  }
  closeProgressDialog(): void {
    throw new Error("Method not implemented.");
  }
  async showAlert(title: string, message: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  confirm(
    title: string,
    subtitle: string,
    message: string,
    confirmButton: string,
    cancelButton: string,
  ): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
