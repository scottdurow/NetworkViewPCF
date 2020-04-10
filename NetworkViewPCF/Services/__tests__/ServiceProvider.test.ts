import { ControlContextService } from "../BaseServices/ControlContextService";

describe("ControlContextService", () => {
  test("OnLoad Event", async () => {
    const contextService = new ControlContextService();
    let onLoaded = false;
    contextService.subscribeToOnLoad(async () => {
      onLoaded = true;
    });
    contextService.notifyOnLoad();
    expect(onLoaded).toBe(true);
  });

  test("OnSave Event", async () => {
    const contextService = new ControlContextService();
    let onSaved = false;
    contextService.subscribeToOnSave(async () => {
      onSaved = true;
    });
    contextService.notifyOnSave();
    expect(onSaved).toBe(true);
  });

  test("OnClose Fullscreen Event", async () => {
    const contextService = new ControlContextService();
    let onClosed = false;
    contextService.subscribeToOnFullScreenClose(async () => {
      onClosed = true;
    });
    contextService.notifyOnClosed();
    expect(onClosed).toBe(true);
  });
});
