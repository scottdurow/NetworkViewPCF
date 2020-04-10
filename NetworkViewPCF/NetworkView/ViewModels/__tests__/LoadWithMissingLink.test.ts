/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { MockPCFContext } from "../../../Services/Mocks/MockPCFContext";
import { NetworkViewServiceProvider } from "../../NetworkViewServiceProvider";
import { QueueProcessor } from "../QueueProcessor";
import { GraphSettings } from "../Config/GraphSettings";
import { EntitySetting } from "../Config/EntitySetting";
import { IEntity, EntityCollection, EntityReference } from "../../../Services/CdsSdk/CdsSdk";
import { RecordNode } from "../RecordNode";
import { RecordLink } from "../RecordLink";
import { NodeObject } from "react-force-graph-2d";

describe("LoadWithMissingLink", () => {
  test("Load with missing link", async () => {
    const mockContext = new MockPCFContext();
    const serviceProvider = new NetworkViewServiceProvider(mockContext);
    const cdsService = serviceProvider.GetServiceClient();

    const settings = {
      entities: [
        {
          logicalName: "account",
          nameAttribute: "name",
          idAttribute: "accountid",
          hierarchical: true,
          fetchXml: "<entity name='account'>   {0}",
          joins: [
            {
              isParent: true,
              leftEntity: "account",
              rightEntity: "account",
              leftAttribute: "accountid",
              rightAttribute: "parentaccountid",
            },
            {
              leftEntity: "account",
              rightEntity: "contact",
              leftAttribute: "accountid",
              rightAttribute: "parentcustomerid",
            },
          ],
        } as EntitySetting,
        {
          logicalName: "contact",
          collectionName: "contacts",
          nameAttribute: "name",
          idAttribute: "contactid",
          hierarchical: true,
          fetchXml: "<entity name='contact'>   {0}",
          joins: [],
        } as EntitySetting,
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
    const account2 = {
      logicalName: "account",
      accountid: "2",
      parentaccountid: new EntityReference("account", "1"),
    } as IEntity;
    const account3 = {
      logicalName: "account",
      accountid: "3",
      parentaccountid: new EntityReference("account", "1"),
    } as IEntity;
    const account4 = {
      logicalName: "account",
      accountid: "4",
    } as IEntity;

    // Contacts
    const contact1 = {
      logicalName: "contact",
      contactid: "1",
      parentcustomerid: new EntityReference("account", "1"),
    } as IEntity;

    const contact2 = {
      logicalName: "contact",
      contactid: "2",
      parentcustomerid: new EntityReference("account", "4"),
    } as IEntity;

    // Mock retrieveMultiple
    cdsService.retrieveMultiple = jest.fn().mockImplementation(async fetch => {
      fetchIterations++;
      console.debug(fetch);
      switch (fetchIterations) {
        case 1:
          return new EntityCollection([account1, account2, account3]);
          break;
        case 2:
          return new EntityCollection([contact1, contact2]);
          break;
        case 3:
          return new EntityCollection([account4]);
          break;
      }

      // Return the first iteration of accounts

      // Return the related contacts
    });

    let more = await queueProcessor.processQueue();
    expect(more).toBe(true);
    // A2=>A1
    // A3=>A1

    expect(fetchIterations).toBe(1);
    expect(queueProcessor.iterations).toBe(1);
    expect(nodesAdded.length).toBe(3);
    expect(linksAdded.length).toBe(2);
    expect((linksAdded[0].source as NodeObject).id).toBe(account2.accountid);
    expect((linksAdded[0].target as NodeObject).id).toBe(account1.accountid);

    // Root flag
    expect(nodesAdded[0].isRoot).toBe(true);
    more = await queueProcessor.processQueue();
    expect(more).toBe(true);
    // C1=> A1
    // C2=> A2
    expect(fetchIterations).toBe(2);
    expect(nodesAdded.length).toBe(3 + 2);
    expect(linksAdded.length).toBe(2 + 1);

    // Loadding missing account 4
    more = await queueProcessor.processQueue();
    expect(more).toBe(true);

    // Extract account loaded
    expect(nodesAdded.length).toBe(3 + 2 + 1);

    // Last load of contacts- no more
    more = await queueProcessor.processQueue();
    expect(more).toBe(false);
  });
});
