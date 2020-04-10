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

describe("Connections", () => {
  test("Load root node", async () => {
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
          fetchXml:
            "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true' no-lock='true'>     <entity name='account'>    <attribute name='accountid'/>    <attribute name='name' />    <attribute name='telephone1'/>    <attribute name='emailaddress1'/>    <attribute name='ownerid'/>     <attribute name='parentaccountid'/>    <order attribute='name' descending='false' />      <filter type='and'>        <condition attribute='statecode' operator='eq' value='0' />       {0}      </filter>     </entity>     </fetch>",
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
          nameAttribute: "name",
          idAttribute: "contactid",
          hierarchical: true,
          fetchXml:
            "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true' no-lock='true'>     <entity name='contact'>   <filter type='and'>        <condition attribute='statecode' operator='eq' value='0' />       {0}      </filter>     </entity>     </fetch>",
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

    // Contacts
    const contact1 = {
      logicalName: "contact",
      contactid: "1",
      parentcustomerid: new EntityReference("account", "1"),
    } as IEntity;

    const contact2 = {
      logicalName: "contact",
      contactid: "2",
      parentcustomerid: new EntityReference("account", "2"),
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
      }

      // Return the first iteration of accounts

      // Return the related contacts
    });

    await queueProcessor.processQueue();

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
    await queueProcessor.processQueue();

    // C1=> A1
    // C2=> A2
    expect(fetchIterations).toBe(2);
    expect(nodesAdded.length).toBe(3 + 2);
    expect(linksAdded.length).toBe(2 + 2);
  });

  test("Load connections with missing account", async () => {
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
              rightEntity: "account",
              leftAttribute: "accountid",
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
      accountid: "1",
    } as IEntity;
    const account2 = {
      logicalName: "account",
      accountid: "2",
    } as IEntity;
    const account3 = {
      logicalName: "account",
      accountid: "3",
    } as IEntity;
    const account4 = {
      logicalName: "account",
      accountid: "4",
    } as IEntity;
    // Connections
    // A1-A2
    // A1-A4
    const connection1 = {
      logicalName: "connection",
      connectionid: "1c",
      record1id: new EntityReference("account", "2"),
      record2id: new EntityReference("account", "1"),
    } as IEntity;

    const connection2 = {
      logicalName: "connection",
      connectionid: "2c",
      record1id: new EntityReference("account", "4"), // This isn't loaded yet - so should be loaded in the second pass
      record2id: new EntityReference("account", "1"),
    } as IEntity;

    // Mock retrieveMultiple
    cdsService.retrieveMultiple = jest.fn().mockImplementation(async fetch => {
      fetchIterations++;
      console.debug(`Query: ${fetchIterations}: ${fetch}`);
      switch (fetchIterations) {
        case 1:
          return new EntityCollection([account1, account2, account3]);
          break;
        case 2:
          return new EntityCollection([connection1, connection2]);
          break;
        case 3:
          return new EntityCollection([account4]);
          break;
        case 4:
          // No futher connections
          return new EntityCollection([]);
          break;
      }

      // Return the first iteration of accounts

      // Return the related contacts
    });

    // Root accounts
    let more = await queueProcessor.processQueue();
    expect(more).toBe(true);
    // A2=>A1
    // A3=>A1

    expect(fetchIterations).toBe(1);
    expect(queueProcessor.iterations).toBe(1);
    expect(nodesAdded.length).toBe(3);
    expect(linksAdded.length).toBe(0);

    // Root flag
    expect(nodesAdded[0].isRoot).toBe(true);

    // Connections
    more = await queueProcessor.processQueue();
    expect(more).toBe(true);

    // Connection A1->A2
    expect(fetchIterations).toBe(2);
    expect(nodesAdded.length).toBe(3);
    expect(linksAdded.length).toBe(1);
    // Check connections
    expect((linksAdded[0].source as NodeObject).id).toBe(account1.accountid);
    expect((linksAdded[0].target as NodeObject).id).toBe(account2.accountid);

    // load accounts load A4
    more = await queueProcessor.processQueue();
    expect(more).toBe(true);
    expect(fetchIterations).toBe(3);
    expect(nodesAdded.length).toBe(4);
    expect(linksAdded.length).toBe(2); // A1=>A4
    // Check connections
    expect((linksAdded[1].source as NodeObject).id).toBe(account1.accountid);
    expect((linksAdded[1].target as NodeObject).id).toBe(account4.accountid);
    expect(linksAdded[1].linkType).toBe("n:n");

    // Next iteration - connections
    more = await queueProcessor.processQueue();
    expect(more).toBe(false);
  });

  test("Load connections with missing contact", async () => {
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
              rightEntity: "account",
              leftAttribute: "accountid",
              rightAttribute: "parentaccountid",
            },
          ],
        } as EntitySetting,
        {
          logicalName: "contact",
          nameAttribute: "name",
          idAttribute: "contactid",
          loadConnections: true,
          fetchXml: "<entity name='contact'>   {0}",
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
    } as IEntity;
    const account3 = {
      logicalName: "account",
      accountid: "3",
    } as IEntity;

    const contact4 = {
      logicalName: "contact",
      contactid: "4",
    } as IEntity;
    // Connections
    // A1-A2
    // A1-A4
    const connection1 = {
      logicalName: "connection",
      connectionid: "1c",
      record1id: new EntityReference("account", "2"),
      record2id: new EntityReference("account", "1"),
    } as IEntity;

    const connection2 = {
      logicalName: "connection",
      connectionid: "2c",
      record1id: new EntityReference("contact", "4"), // This isn't loaded yet - so should be loaded in the second pass
      record2id: new EntityReference("account", "1"),
    } as IEntity;

    // Mock retrieveMultiple
    cdsService.retrieveMultiple = jest.fn().mockImplementation(async fetch => {
      fetchIterations++;
      console.debug(`Query: ${fetchIterations}: ${fetch}`);
      switch (fetchIterations) {
        case 1:
          return new EntityCollection([account1, account2, account3]);
          break;
        case 2:
          return new EntityCollection([connection1, connection2]);
          break;
        case 3:
          return new EntityCollection([contact4]);
          break;
        case 4:
          // No futher connections
          return new EntityCollection([]);
          break;
      }

      // Return the first iteration of accounts

      // Return the related contacts
    });

    // Root accounts
    let more = await queueProcessor.processQueue();
    expect(more).toBe(true);
    // A2=>A1
    // A3=>A1

    expect(fetchIterations).toBe(1);
    expect(queueProcessor.iterations).toBe(1);
    expect(nodesAdded.length).toBe(3);
    expect(linksAdded.length).toBe(0);

    // Root flag
    expect(nodesAdded[0].isRoot).toBe(true);

    // Contacts
    more = await queueProcessor.processQueue();
    expect(more).toBe(true);

    // Connections
    more = await queueProcessor.processQueue();
    expect(more).toBe(true);

    // Connection A1->A2
    expect(fetchIterations).toBe(2);
    expect(nodesAdded.length).toBe(3);
    expect(linksAdded.length).toBe(1);
    // Check connections
    expect((linksAdded[0].source as NodeObject).id).toBe(account1.accountid);
    expect((linksAdded[0].target as NodeObject).id).toBe(account2.accountid);

    // load accounts
    more = await queueProcessor.processQueue();
    expect(more).toBe(true);

    // load contact load A4
    more = await queueProcessor.processQueue();
    expect(more).toBe(true);
    expect(fetchIterations).toBe(3);
    expect(nodesAdded.length).toBe(4);
    expect(linksAdded.length).toBe(2); // A1=>A4
    // Check connections
    expect((linksAdded[1].source as NodeObject).id).toBe(account1.accountid);
    expect((linksAdded[1].target as NodeObject).id).toBe(contact4.contactid);
    expect(linksAdded[1].linkType).toBe("n:n");

    // Next iteration - connections
    more = await queueProcessor.processQueue();
    expect(more).toBe(false);
  });
});
