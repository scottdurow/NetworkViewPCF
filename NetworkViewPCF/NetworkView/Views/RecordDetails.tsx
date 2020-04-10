/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { observer } from "mobx-react";
import { Stack, IconButton, Link, Icon } from "office-ui-fabric-react";
import * as React from "react";

import { RecordNode } from "../ViewModels/RecordNode";
import { ServiceProviderBase } from "../../Services/ServiceProviderBase";
import { RecordLink } from "../ViewModels/RecordLink";

export interface RecordDetailsProps {
  node?: RecordNode | undefined | null;
  link?: RecordLink | undefined | null;
  serviceProvider: ServiceProviderBase;
}

export class RecordDetails extends React.Component<RecordDetailsProps> {
  openRecord = () => {
    if (this.props.node?.logicalName) {
      this.props.serviceProvider.GetControlContextService().fullScreen(false);
      this.props.serviceProvider.GetDialogService().openRecord(this.props.node.logicalName, this.props.node.id);
    }
  };

  render() {
    const { node, link } = this.props;
    return (
      <>
        {node && (
          <Stack styles={{ root: { padding: 10 } }}>
            <Stack.Item>{node.settings.displayName}</Stack.Item>
            <Stack.Item>
              <Stack horizontal verticalAlign="center">
                <Stack.Item>
                  <Link onClick={this.openRecord}>{node.name}</Link>
                </Stack.Item>
                <IconButton iconProps={{ iconName: "OpenInNewWindow" }} onClick={this.openRecord}></IconButton>
              </Stack>
            </Stack.Item>
          </Stack>
        )}
        {link && (
          <Stack styles={{ root: { padding: 10 } }}>
            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
              <Stack.Item>{(link.source as RecordNode).settings.displayName}</Stack.Item>
              <Stack.Item>
                <Icon iconName="NavigateBackMirrored"></Icon>
              </Stack.Item>
              <Stack.Item>{(link.target as RecordNode).settings.displayName}</Stack.Item>
            </Stack>
            {link.intersect && (
              <>
                <Stack.Item>{link.intersect.settings.displayName}</Stack.Item>
                <Stack.Item>
                  {link.intersect.data?.formattedValues && link.intersect.data.formattedValues["_record1roleid_value"]}{" "}
                  {link.intersect.data?.formattedValues && link.intersect.data.formattedValues["_record2roleid_value"]}
                </Stack.Item>
              </>
            )}
          </Stack>
        )}
      </>
    );
  }
}

observer(RecordDetails);
