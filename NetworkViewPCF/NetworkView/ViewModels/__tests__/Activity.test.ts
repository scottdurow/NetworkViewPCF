/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { MockPCFContext } from "../../../Services/Mocks/MockPCFContext";
import { NetworkViewServiceProvider } from "../../NetworkViewServiceProvider";
import { QueueProcessor } from "../QueueProcessor";
import { GraphSettings } from "../Config/GraphSettings";
import { IEntity, EntityCollection, EntityReference } from "../../../Services/CdsSdk/CdsSdk";
import { RecordNode } from "../RecordNode";
import { RecordLink } from "../RecordLink";

describe("NetworkViewModel", () => {
  test("Load activites", async () => {
    const mockContext = new MockPCFContext();
    const serviceProvider = new NetworkViewServiceProvider(mockContext);
    const cdsService = serviceProvider.GetServiceClient();

    const settings = {
      acitvityFetchXml: "<entity name='activityparty'> {0}",
      entities: [
        {
          logicalName: "account",
          collectionName: "accounts",
          nameAttribute: "name",
          idAttribute: "accountid",
          loadActivities: true,
          hierarchical: true,
          fetchXml: "<entity name='account'> {0}",
          joins: [],
        },
      ],
    } as GraphSettings;

    const queueProcessor = new QueueProcessor(settings, serviceProvider);

    const nodesAdded: RecordNode[] = [];
    const linksAdded: RecordLink[] = [];

    queueProcessor.addEntityNodes = entities => {
      for (const row of entities) {
        nodesAdded.push(row);
      }
      return true;
    };
    queueProcessor.addEntityLinks = links => {
      for (const row of links) {
        linksAdded.push(row);
      }
      return true;
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    queueProcessor.onIterationCompleted = () => {};
    queueProcessor.setRoot("account", ["1"]);

    let fetchIterations = 0;
    const account1 = {
      logicalName: "account",
      accountid: "1",
    } as IEntity;
    // const account2 = {
    //   logicalName: "account",
    //   accountid: "2",
    // } as IEntity;

    // Activities
    const activity = {
      logicalName: "activity",
      activity: "a1",
      partyid: new EntityReference(),
      subject: "activity subject",
    } as IEntity;

    // Activity Parties
    const activitypart1 = {
      logicalName: "activityparty",
      activitypartyid: "ap1",
      activityid: "a1",
      partyid: account1.accountid,
    } as IEntity;

    // const activitypart2 = {
    //   logicalName: "activityparty",
    //   activitypartyid: "ap2",
    //   activityid: "a1",
    //   partyid: account2.accountid,
    // } as IEntity;

    // Mock retrieveMultiple
    cdsService.retrieveMultiple = jest.fn().mockImplementation(async fetch => {
      fetchIterations++;
      console.debug(fetch);
      switch (fetchIterations) {
        case 1:
          return new EntityCollection([account1]);
          break;
        case 2:
          return new EntityCollection([activitypart1]);
          break;
        case 3:
          return new EntityCollection([activity]);
          break;
        case 4:
          return new EntityCollection([activity]);
          break;
      }

      // Load the activity using the fetchxml party join
      // Load the activity parties - and join to existing/missing links

      // Return the first iteration of accounts

      // Return the related contacts
    });

    await queueProcessor.processQueue();
  });
});
