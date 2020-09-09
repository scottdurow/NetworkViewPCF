# NetworkViewPCF

Back at the end of 2015, Power Apps wasn’t even a thing. My world revolved around Dynamics 365 and the release cadence that was bringing us updates to the platform that were either keeping up with SalesForce or providing greater customizability. 
Much has changed since then, not least the way that we write rich UI extensions. With this in mind I have completely re-written my [Network View solution](https://develop1.net/public/post/2015/11/06/New-version-of-Network-Visualisations-for-Dynamics-CRM) to use TypeScript and the Power Apps Component Framework.

<img src="https://github.com/scottdurow/NetworkViewPCF/blob/master/NetworkViewPCF.gif?raw=true" width="200" alt="Mobile App Demo"/>

This version has some notable improvements on the old version:
- Shows details of links
- Allows including inside the actual form (thanks to PCF)

There are a few more items TODO to bring parity with the old version:
- Loading Activities
- Showing the users/connection roles for the network

# Building the solution
The solution can be built using:
```
NetworkViewPCF\NetworkViewPCFSolution\build-solution.bat
```
This will output both a managed and unmanaged solution that contains:
- The PCF control
- Account and Contact forms with the NetworkView control added

# Configuration
The default config loads, Accounts, Contacts, Opportunities, Cases & Connections.

If you are installing on a plain CDS environment (not a Dynamics one) you won't have opportunities or cases and will need to change the configuration. This can be done by adding a JavaScript webresource and then referencing it in the Control properties:

<img src="https://github.com/scottdurow/NetworkViewPCF/blob/master/ControlConfig.png?raw=true" width="200" alt="Mobile App Demo"/>

The contents of this file should look something like: [defaultConfig.js](https://github.com/scottdurow/NetworkViewPCF/blob/master/NetworkViewPCF/defaultConfig.js)

This file is similar to the old version, but not identical! TODO: Add information on the configuration schema

# Troubleshooting
1. Each user will need at least basic read access to all the entities that are loaded into the Network View.
