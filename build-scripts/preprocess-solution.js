// To test from commandline use
// node preprocess-solution.js
module.exports = ({majorVersion, minorVersion, buildVersion}) => {
    const fs = require("fs");
    const path = require("path");
    
    const workspaceDir = process.env.GITHUB_WORKSPACE || path.resolve(__dirname,"../");
    // Copy the PCF control outputs to the solution folders for packing
    console.log(`Workspace Directory: ${workspaceDir}`);
    console.log(`Version:${majorVersion}.${minorVersion}.${buildVersion}`);
    fs.copyFileSync(
        `${workspaceDir}/NetworkViewPCF/out/controls/NetworkView/bundle.js`,
        `${workspaceDir}/NetworkViewPCFSolution/solution_package/Controls/dev1_dev1.NetworkView/bundle.js`);
    fs.copyFileSync(
        `${workspaceDir}/NetworkViewPCF/out/controls/NetworkView/ControlManifest.xml`,
        `${workspaceDir}/NetworkViewPCFSolution/solution_package/Controls/dev1_dev1.NetworkView/ControlManifest.xml`);
    console.log(`files copied`);

    // Update the versions in the solution files
    const replace = require("replace-in-file");
    const resultsPCF = replace.sync({
        files: `${workspaceDir}/NetworkViewPCFSolution/solution_package/Controls/dev1_dev1.NetworkView/ControlManifest.xml`,
        from: /constructor="NetworkView" version="[0-9]+.[0-9]+.[0-9]+"/g,
        to: `constructor="NetworkView" version="${majorVersion}.${minorVersion}.${buildVersion}"`,
        countMatches: true,
      });
    console.log(resultsPCF);
    const resultsSolution = replace.sync({
        files: `${workspaceDir}/NetworkViewPCFSolution/solution_package/Other/Solution.xml`,
        from: /\<Version\>[0-9]+.[0-9]+.[0-9]+.[0-9]+\<\/Version>/g,
        to: `<Version>${majorVersion}.${minorVersion}.0.${buildVersion}</Version>`,
        countMatches: true,
      });
      
    console.log(resultsSolution);
};

if (!process.env.GITHUB_WORKSPACE)
{
    module.exports({majorVersion:"1",minorVersion:"0",buildVersion:"1"});
}