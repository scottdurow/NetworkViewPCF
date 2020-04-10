import { GraphSettings } from "./Config/GraphSettings";

export const defaultConfig = {
  iterationCountPerLoad: 20,
  trace: false,
  demoModeInitialState: true,
  connectionFetchXml: `<fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="false" nolock="true" >
    <entity name="connection" >
      <attribute name="record2id" />
      <attribute name="record2roleid" />
      <attribute name="connectionid" />
      <attribute name="record1roleid" />
      <attribute name="record1id" />
      <attribute name="relatedconnectionid" />
      <order attribute="record1id" descending="false" />
      <filter type="and" >
        <condition attribute="record1id" operator="not-null" />
        <condition attribute="record2id" operator="not-null" />    
        <filter type="or" >
         {0}
        </filter>
      </filter>
    </entity>
  </fetch>`,
  acitvityFetchXml: `<fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="true" no-lock="true" count="100" >
    <entity name="activitypointer" >
      <attribute name="activityid" />
      <attribute name="activitytypecode" />
      <attribute name="subject" />
      <attribute name="modifiedon" />
      <attribute name="actualstart" />
      <attribute name="actualend" />
      <attribute name="scheduledstart" />
      <attribute name="scheduledend" />
      <attribute name="statecode" />
      <attribute name="regardingobjectid" />
      <attribute name="allparties" />
      <order attribute="modifiedon" descending="true" />
      <link-entity name="activityparty" from="activityid" to="activityid" alias="ab" >
        <filter type="and" >
          {0}
        </filter>
      </link-entity>
    </entity>
  </fetch>`,
  entities: [
    {
      displayName: "Account",
      logicalName: "account",
      collectionName: "accounts",
      nameAttribute: "name",
      idAttribute: "accountid",
      parentAttributeId: "parentaccountid",
      loadActivities: false,
      loadConnections: true,
      hierarchical: true,
      entityImageUrl: "/_imgs/svg_1.svg",
      color: "#582F4D",
      showLabel: true,
      fetchXml:
        "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true' no-lock='true'>     <entity name='account'>    <attribute name='accountid'/>  <attribute name='entityimage_url'/>   <attribute name='name' />    <attribute name='telephone1'/>    <attribute name='emailaddress1'/>    <attribute name='ownerid'/>     <attribute name='parentaccountid'/>    <order attribute='name' descending='false' />      <filter type='and'>        <condition attribute='statecode' operator='eq' value='0' />       {0}      </filter>     </entity>     </fetch>",
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
        {
          leftEntity: "account",
          rightEntity: "opportunity",
          leftAttribute: "accountid",
          rightAttribute: "customerid",
        },
        {
          leftEntity: "account",
          rightEntity: "incident",
          leftAttribute: "accountid",
          rightAttribute: "customerid",
        },
      ],
    },
    {
      displayName: "Contact",
      logicalName: "contact",
      collectionName: "contacts",
      nameAttribute: "fullname",
      idAttribute: "contactid",
      parentAttributeId: "parentcustomerid",
      loadActivities: false,
      loadConnections: true,
      hierarchical: false,
      entityImageUrl: "/_imgs/svg_2.svg",
      color: "#455FA0",
      showLabel: true,
      fetchXml:
        "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true' no-lock='true'>     <entity name='contact'><attribute name='entityimage_url'/>    <attribute name='contactid'/>    <attribute name='fullname'  />    <attribute name='telephone1'/>    <attribute name='emailaddress1'/>    <attribute name='ownerid'/>    <attribute name='parentcustomerid'/>      <filter type='and'>           {0}    </filter>    <link-entity name='systemuser' from='internalemailaddress' to='emailaddress1' link-type='outer' >    <attribute name='systemuserid' alias='systemuserid' />     </link-entity>     </entity>     </fetch>",
      joins: [
        {
          leftEntity: "contact",
          leftAttribute: "contactid",
          rightEntity: "opportunity",
          rightAttribute: "customerid",
        },
        {
          leftEntity: "contact",
          leftAttribute: "contactid",
          rightEntity: "incident",
          rightAttribute: "customerid",
        },
        {
          leftEntity: "account",
          leftAttribute: "accountid",
          rightEntity: "contact",
          rightAttribute: "parentcustomerid",
        },
        {
          leftEntity: "contact",
          leftAttribute: "contactid",
          rightEntity: "contact",
          rightAttribute: "parentcustomerid",
        },
      ],
    },
    {
      displayName: "Opportunity",
      logicalName: "opportunity",
      collectionName: "opportunities",
      nameAttribute: "name",
      idAttribute: "opportunityid",
      parentAttributeId: "customerid",
      loadActivities: false,
      loadConnections: true,
      hierarchical: false,
      entityImageUrl: "/_imgs/svg_3.svg",
      color: "#598721",
      fetchXml:
        "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true' no-lock='true'>     <entity name='opportunity'>     <attribute name='opportunityid'/>  <attribute name='name' />   <attribute name='ownerid'/>    <attribute name='customerid'/>    <attribute name='modifiedon'/>      <filter type='and'>          {0}    </filter>         </entity>     </fetch>",
      joins: [
        {
          leftEntity: "contact",
          leftAttribute: "contactid",
          rightEntity: "opportunity",
          rightAttribute: "customerid",
        },
        {
          leftEntity: "account",
          rightEntity: "opportunity",
          leftAttribute: "accountid",
          rightAttribute: "customerid",
        },
      ],
    },
    {
      displayName: "Case",
      logicalName: "incident",
      collectionName: "incidents",
      nameAttribute: "title",
      idAttribute: "incidentid",
      parentAttributeId: "customerid",
      loadActivities: false,
      loadConnections: true,
      hierarchical: false,
      entityImageUrl: "/_imgs/svg_10.svg",
      color: "#8B2C1B",
      fetchXml:
        "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true' no-lock='true'>     <entity name='incident'>     <attribute name='incidentid'/>     <attribute name='ticketnumber' />  <attribute name='title' />   <attribute name='ownerid'/>    <attribute name='customerid'/>    <attribute name='modifiedon'/>     <filter type='and'>        <condition attribute='statecode' operator='eq' value='0' />    {0}    </filter>          </entity>     </fetch>",
      joins: [
        {
          leftEntity: "contact",
          leftAttribute: "contactid",
          rightEntity: "incident",
          rightAttribute: "customerid",
        },
        {
          leftEntity: "account",
          rightEntity: "incident",
          leftAttribute: "accountid",
          rightAttribute: "customerid",
        },
      ],
    },
  ],
  // quickViewForms: {
  //     account: { address1_city: 'City', telephone1: 'Tel' },
  //     contact: { emailaddress1: 'Email', telephone1: 'Tel' },
  //     incident: { ticketnumber: 'CaseId', title: 'Title' },
  //     opportunity: { name: 'Subject', statecode: 'Status' },
  //     letter: { modifiedon: 'Modified', statecode: 'Status', actualedend: 'Due', regardingobjectid: 'Regarding' },
  //     email: { modifiedon: 'Modified', statecode: 'Status', actualend: 'Sent', regardingobjectid: 'Regarding' },
  //     phonecall: { modifiedon: 'Modified', statecode: 'Status', scheduledend: 'Due' },
  //     appointment: { statecode: 'Status', scheduledstart: 'Start', scheduledend: 'End', regardingobjectid: 'Regarding' },
  //     task: { modifiedon: 'Modified', statecode: 'Status', scheduledend: 'Due' }
  // }
} as GraphSettings;
