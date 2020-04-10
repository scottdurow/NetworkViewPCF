import { decorate, observable } from "mobx";
import { DialogService } from "../BaseServices/DialogService";

export class PCFDialogService implements DialogService {
  isOpen = false;
  message = "<Message>";
  title = "<Title>";
  progressOpen = false;
  context: ComponentFramework.Context<unknown>;
  constructor(context: ComponentFramework.Context<unknown>) {
    this.context = context;
  }
  openRecord(loicalName: string, id: string): void {
    const version = Xrm.Utility.getGlobalContext()
      .getVersion()
      .split(".");
    const mobile = this.context.client.getClient() == "Mobile";
    // MFD (main form dialog) is available past ["9", "1", "0000", "15631"]
    // But doesn't work on mobile client
    if (
      !mobile &&
      version.length == 4 &&
      Number.parseFloat(version[0] + "." + version[1]) >= 9.1 &&
      Number.parseFloat(version[2] + "." + version[3]) >= 0.15631
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Xrm.Navigation as any).navigateTo(
        {
          entityName: loicalName,
          pageType: "entityrecord",
          formType: 2,
          entityId: id,
        },
        { target: 2, position: 1, width: { value: 80, unit: "%" } },
      );
    } else {
      this.context.navigation.openForm({
        entityName: loicalName,
        entityId: id,
      });
    }
  }
  showErrorDialog(ex: Error): void {
    const err = new Error();
    this.context.navigation.openErrorDialog({
      message: ex.message,
      details: JSON.stringify(ex) + ex.stack + err.stack,
    });
  }

  showProgressDialog(message: string): void {
    Xrm.Utility.showProgressIndicator(message);
  }
  closeProgressDialog(): void {
    Xrm.Utility.closeProgressIndicator();
  }
  async showAlert(title: string, message: string): Promise<void> {
    this.title = title;
    this.message = message;
    this.isOpen = true;
    return;
  }

  async confirm(
    title: string,
    subtitle: string,
    message: string,
    confirmButton: string,
    cancelButton: string,
  ): Promise<boolean> {
    try {
      const result = await this.context.navigation.openConfirmDialog({
        title: title,
        subtitle: subtitle,
        text: message,
        confirmButtonLabel: confirmButton,
        cancelButtonLabel: cancelButton,
      });
      return result.confirmed;
    } catch (ex) {
      return false;
    }
  }

  openNewWindow(url: string): void {
    this.context.navigation.openUrl(url);
  }
}

decorate(PCFDialogService, {
  isOpen: observable,
  message: observable,
  title: observable,
  progressOpen: observable,
});
