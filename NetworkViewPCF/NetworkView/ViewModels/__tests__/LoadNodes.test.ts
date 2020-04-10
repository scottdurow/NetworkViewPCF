import { MockPCFContext } from "../../../Services/Mocks/MockPCFContext";
import { NetworkViewModel } from "../NetworkViewModel";
import { NetworkViewServiceProvider } from "../../NetworkViewServiceProvider";

describe("NetworkViewModel", () => {
  test("Load records using fetch", async () => {
    const mockContext = new MockPCFContext();
    const serviceProvider = new NetworkViewServiceProvider(mockContext);
    const cdsService = serviceProvider.GetServiceClient();
    // Mock retrieveMultiple
    cdsService.retrieveMultiple = jest.fn().mockImplementation(async fetch => {
      console.debug(fetch);
    });

    const vm = new NetworkViewModel(serviceProvider);
    expect(vm.isLoading).toBe(false);
  });
});
