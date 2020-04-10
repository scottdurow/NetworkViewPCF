/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { MockPCFContext } from "../../../Services/Mocks/MockPCFContext";
import { NetworkViewServiceProvider } from "../../NetworkViewServiceProvider";
import { QueueProcessor } from "../QueueProcessor";
import { GraphSettings } from "../Config/GraphSettings";
import { EntitySetting } from "../Config/EntitySetting";
import { IEntity, EntityCollection, EntityReference } from "../../../Services/CdsSdk/CdsSdk";
import { RecordNode } from "../RecordNode";
import { RecordLink } from "../RecordLink";

describe("ManyToOneLoad", () => {
  test("Connect to contact load parent account", async () => {
    // When a contact is related to a parent account that was not loaded as the root
    const mockContext = new MockPCFContext();
    const serviceProvider = new NetworkViewServiceProvider(mockContext);
    const cdsService = serviceProvider.GetServiceClient();

    const settings = {
      connectionFetchXml: "<entity name='connection'>{0}",
      entities: [
        {
          logicalName: "account",
          nameAttribute: "name",
          idAttribute: "accountid",
          hierarchical: true,
          loadConnections: true,
          fetchXml: "<entity name='account'>{0}",
          joins: [
            {
              isParent: true,
              leftEntity: "account",
              leftAttribute: "accountid",
              rightEntity: "account",
              rightAttribute: "parentaccountid",
            },
            {
              isParent: true,
              leftEntity: "account",
              leftAttribute: "accountid",
              rightEntity: "contact",
              rightAttribute: "parentaccountid",
            },
          ],
        } as EntitySetting,
        {
          logicalName: "contact",
          collectionName: "contacts",
          nameAttribute: "name",
          idAttribute: "contactid",
          loadConnections: true,
          fetchXml: "<entity name='contact'>   {0}",
          joins: [
            {
              leftEntity: "account",
              leftAttribute: "accountid",
              rightEntity: "contact",
              rightAttribute: "parentaccountid",
            },
          ],
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
      accountid: "a1",
    } as IEntity;
    const account2 = {
      logicalName: "account",
      accountid: "a2",
    } as IEntity;

    const contact1 = {
      logicalName: "contact",
      contactid: "c1",
      parentaccountid: new EntityReference("account", "a2"),
    } as IEntity;

    // Connections
    // A1-A2
    // A1-A4
    const connection1 = {
      logicalName: "connection",
      connectionid: "1c",
      record1id: new EntityReference("contact", "c1"),
      record2id: new EntityReference("account", "a1"),
    } as IEntity;

    // Mock retrieveMultiple
    cdsService.retrieveMultiple = jest.fn().mockImplementation(async fetch => {
      fetchIterations++;
      console.debug(`Query: ${fetchIterations}: ${fetch}`);
      switch (fetchIterations) {
        case 1:
          // Root account
          return new EntityCollection([account1]);
        case 2:
          // No contacts
          return new EntityCollection([]);
        case 3:
          // Connection to contact1
          return new EntityCollection([connection1]);
        case 4:
          // No accounts - move to contacts
          return new EntityCollection([contact1]);
        case 5:
          // No futher connections
          return new EntityCollection([]);
        case 6:
          // Acount 2 (parent to contact 1)
          return new EntityCollection([account2]);
      }
    });

    // Root accounts
    let more = await queueProcessor.processQueue();
    expect(more).toBe(true);
    // A1
    expect(queueProcessor.iterations).toBe(1);
    expect(nodesAdded.length).toBe(1);
    expect(linksAdded.length).toBe(0);

    // Contacts
    more = await queueProcessor.processQueue();
    expect(more).toBe(true);
    // No records
    expect(queueProcessor.iterations).toBe(2);
    expect(nodesAdded.length).toBe(1);
    expect(linksAdded.length).toBe(0);

    // Connections
    // A1=>C1
    more = await queueProcessor.processQueue();
    expect(more).toBe(true);
    // Connection pending to C1
    expect(queueProcessor.iterations).toBe(3);
    expect(nodesAdded.length).toBe(1);
    expect(linksAdded.length).toBe(0);

    // load accounts
    more = await queueProcessor.processQueue();
    expect(more).toBe(true);
    // No accounts loaded
    expect(queueProcessor.iterations).toBe(4);
    expect(nodesAdded.length).toBe(1);
    expect(linksAdded.length).toBe(0);

    // load contact C1
    more = await queueProcessor.processQueue();
    expect(more).toBe(true);
    // Added C1 and link A1-C1
    expect(queueProcessor.iterations).toBe(5);
    expect(nodesAdded.length).toBe(2);
    expect(linksAdded.length).toBe(1);

    // load connections
    more = await queueProcessor.processQueue();
    expect(more).toBe(true);
    // No connections
    expect(queueProcessor.iterations).toBe(6);
    expect(nodesAdded.length).toBe(2);
    expect(linksAdded.length).toBe(1);

    // load accounts
    more = await queueProcessor.processQueue();
    expect(more).toBe(true);
    // A2  and link C1 - A2
    expect(queueProcessor.iterations).toBe(7);
    expect(nodesAdded.length).toBe(3);
    expect(linksAdded.length).toBe(2);
  });
});
