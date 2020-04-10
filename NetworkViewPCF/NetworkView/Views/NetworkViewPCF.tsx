/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable react/no-unescaped-entities */
import { observer } from "mobx-react";
import {
  Callout,
  DirectionalHint,
  IconButton,
  Stack,
  StackItem,
  MessageBar,
  MessageBarType,
} from "office-ui-fabric-react";
import * as React from "react";

import { NetworkViewModel } from "../ViewModels/NetworkViewModel";
import { RecordNode } from "../ViewModels/RecordNode";
import { ForceGraphInstance, NodeObject, LinkObject } from "force-graph";
import ForceGraph2D from "react-force-graph-2d";
import { RecordLink } from "../ViewModels/RecordLink";
import { Dictionary } from "../../Services/CdsSdk/CdsSdk";
import { LoadProgress } from "./LoadProgress";
import { RecordDetails } from "./RecordDetails";
export interface NetworkViewProps {
  vm: NetworkViewModel;
  width: number;
  height: number;
}
export interface ForceChange {
  distanceMax(distance: number): void;
}
export class NetworkViewPCF extends React.Component<NetworkViewProps> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  private clickCount = 0;
  private doubleClickTimeoutHandle = 0;
  private forceInstance: ForceGraphInstance;
  private gref = React.createRef();
  private imageCache: Dictionary<HTMLImageElement> = {};
  constructor(props: NetworkViewProps) {
    super(props);
    this.props.vm.onZoomToFitRequested = this.zoomToFit;
  }
  getImageFromCache(url: string): HTMLImageElement {
    const cached = this.imageCache[url.toLowerCase()];
    if (!cached) {
      const image = new Image();
      image.width = 4;
      image.height = 4;
      image.onload = () => {};
      image.src = url;
      this.imageCache[url.toLowerCase()] = image;
      return image;
    } else {
      return cached;
    }
  }
  public componentDidMount() {
    console.debug("PCF Component Mounted");
    this.forceInstance = (this.gref?.current as unknown) as ForceGraphInstance;
    const charge = (this.forceInstance.d3Force("charge") as unknown) as ForceChange;
    charge.distanceMax(150);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentDidCatch(error: any) {
    const dialogService = this.props.vm.serviceProvider.GetDialogService();
    dialogService.showErrorDialog(error);
  }

  nodeLabel = (obj: NodeObject): string => {
    return "";
  };

  getColor(n: number) {
    return "#" + ((n * 1234567) % Math.pow(2, 24)).toString(16).padStart(6, "0");
  }

  onHoverNode = (node: NodeObject | null, previousNode: NodeObject | null) => {
    this.props.vm.zoom = this.forceInstance.zoom();
    if (node) {
      this.props.vm.onHoverNode(node, previousNode);
      this.props.vm.onHoverLink(null);
    }
  };

  onNodeClick = (node: NodeObject) => {
    this.props.vm.zoom = this.forceInstance.zoom();
    // Detect double click
    this.clickCount++;

    if (this.clickCount > 1) {
      // Double Click
      clearTimeout(this.doubleClickTimeoutHandle);
      this.props.vm.onNodeDoubleClick(node as RecordNode);
    }

    this.doubleClickTimeoutHandle = window.setTimeout(() => {
      // Single Click
      this.clickCount = 0;
      this.props.vm.onNodeClick(node);
    }, 300);
  };

  onLinkHover = (link: LinkObject | null, previousLink: LinkObject | null) => {
    this.props.vm.onHoverNode(null, null);
    this.props.vm.onHoverLink(link);
  };
  onLinkClick = (link: LinkObject, event: MouseEvent) => {};
  getRatio(globalScale: number) {
    let ratio = 1 / this.props.vm.zoom;
    ratio = ratio < 0.3 ? 0.3 : ratio;
    return ratio;
  }
  linkCanvasObject = (link: LinkObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const recordLink = link as RecordLink;
    const ratio = this.getRatio(globalScale);
    const hovered = this.props.vm.currentLink == link;
    let colour = "#ccc";
    let width = this.getLineWidthForZoom(ratio);
    if (recordLink.linkType == "parent") {
      width = width * 2;
      colour = "blue";
    }
    colour = hovered ? "red" : colour;
    ctx.beginPath();
    ctx.shadowBlur = 0;

    if (recordLink.linkType == "n:n" || recordLink.linkType == "regarding") {
      ctx.setLineDash([1 * ratio, 2 * ratio]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.strokeStyle = colour;
    const fromx = (link.source as NodeObject).x;
    const fromy = (link.source as NodeObject).y;
    const tox = (link.target as NodeObject).x;
    const toy = (link.target as NodeObject).y;
    if (fromx && fromy && tox && toy) {
      ctx.moveTo(fromx, fromy);
      ctx.lineTo(tox, toy);
      ctx.stroke();
      if (link) this.canvasDrawArrow(ctx, recordLink, fromx, fromy, tox, toy, ctx.strokeStyle);
    }
  };
  getLineWidthForZoom(globalScale: number) {
    const lineWidth = globalScale * 1;

    return lineWidth;
  }
  canvasDrawArrow(
    ctx: CanvasRenderingContext2D,
    link: RecordLink,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
  ) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;

    if (link.directional) {
      // draw the ending arrowhead
      let endRadians = Math.atan((y2 - y1) / (x2 - x1));
      endRadians += ((x2 > x1 ? 90 : -90) * Math.PI) / 180;
      this.drawArrowhead(ctx, x2, y2, endRadians);
    }
  }
  drawArrowhead(ctx: CanvasRenderingContext2D, x: number, y: number, radians: number) {
    const width = 2; // * this.ratio;
    const height = 10; // * this.ratio;
    ctx.save();
    ctx.beginPath();
    ctx.translate(x, y);
    ctx.rotate(radians);
    ctx.moveTo(0, 6);
    ctx.lineTo(width, height);
    ctx.lineTo(-width, height);
    ctx.closePath();
    ctx.restore();
    ctx.fill();
  }

  onFullScreen = () => {
    this.props.vm.toggleFullScreen();
    setTimeout(() => {
      this.zoomToFit();
    }, 1000);
  };
  onZoomEnd = (transform: { k: number; x: number; y: number }) => {
    if (this.forceInstance) {
      this.props.vm.zoom = this.forceInstance.zoom();
    }
  };

  zoomToFit = () => {
    let maxX = 0;
    let minX = 0;
    let maxY = 0;
    let minY = 0;

    for (const node of this.props.vm.data.nodes) {
      const nodeRecord = node as RecordNode;

      if (nodeRecord.x > maxX) {
        maxX = nodeRecord.x;
      }
      if (nodeRecord.x < minX) {
        minX = nodeRecord.x;
      }
      if (nodeRecord.y > maxY) {
        maxY = nodeRecord.y;
      }
      if (nodeRecord.y < minY) {
        minY = nodeRecord.y;
      }
    }

    const minPoint = this.forceInstance.graph2ScreenCoords(minX, minY);
    const maxPoint = this.forceInstance.graph2ScreenCoords(maxX, maxY);

    const boundWidth = maxX - minX;
    const boundHeight = maxY - minY;

    const viewwidth = this.props.width;
    const viewheight = this.props.height;

    const overflowX = boundWidth - viewwidth;
    const overflowY = boundHeight - viewheight;

    // Zoom out
    const xScale = 1 * ((boundWidth - overflowX) / boundWidth);
    const yScale = 1 * ((boundHeight - overflowY) / boundHeight);
    const zoomFactor = xScale < yScale ? xScale : yScale;

    let actualZoom = zoomFactor * 0.8;
    if (actualZoom > 3) actualZoom = 3;
    this.forceInstance.zoom(actualZoom, 100);

    this.forceInstance.centerAt(minX + (maxX - minX) / 2, minY + (maxY - minY) / 2, 100);
    this.forceInstance.d3ReheatSimulation();
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderNode = (obj: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number, isShadow?: boolean) => {
    const node = obj as RecordNode;
    const nodesize = 4;
    const { id, x, y } = node;
    const nodeId = Number.parseInt(id);
    const current = this.props.vm.currentNode && this.props.vm.currentNode.id == id;
    const sizeFactor = current ? 1.5 : 1;
    const color = node.color ? node.color : "blue";

    // White circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, nodesize + 2 * sizeFactor, 0, 2 * Math.PI, false);
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "black";
    ctx.fillStyle = "white";
    ctx.fill();

    if (node.groupedNodes) {
      // Draw the number of items in the group
      ctx.font = "9px Sans-Serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#222222";
      ctx.fillText(node.groupedNodes.length.toString(), x, y);
    } else {
      // Circle with icon in it
      ctx.beginPath();
      ctx.arc(x, y, nodesize * sizeFactor, 0, 2 * Math.PI, false);
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.strokeStyle = current ? "red" : color;
      ctx.stroke();
      ctx.imageSmoothingEnabled = true;
      ctx.shadowBlur = 0;
      ctx.shadowColor = "";
      // Add text
      if (node.label) {
        ctx.font = "5px Sans-Serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.shadowColor = "#33333333";
        ctx.shadowBlur = 7;
        ctx.shadowOffsetX = 6 * sizeFactor;
        ctx.shadowOffsetY = 6 * sizeFactor;

        ctx.fillStyle = "#666666";
        const truncatedText = node.label.length > 50 ? node.label.substr(0, 50) + "..." : node.label;
        ctx.fillText(truncatedText, x, y + nodesize * 3);
      }
      if (node.isRoot == true) {
        // Red root highlight
        ctx.beginPath();
        ctx.arc(x, y, nodesize * sizeFactor * 1.5, 0, 2 * Math.PI, false);
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#b2d1d4";
        ctx.stroke();
      }
      if (node.entityUrl) {
        const image = this.getImageFromCache(node.entityUrl);
        if (image) {
          let size = nodesize * sizeFactor;

          if (!node.isIconUrl) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
          } else {
            // Make icon a bit smaller
            size = size * 0.4;
          }
          const cx = x - size;
          const cy = y - size;
          ctx.drawImage(
            //this.imgs[0],
            image,
            cx,
            cy,
            size * 2,
            size * 2,
          );
        }
      }
    }

    ctx.restore();
  };
  onCalloutDismiss = () => {
    this.props.vm.currentNode = undefined;
  };
  render() {
    const { vm, width, height } = this.props;
    const { currentLink, currentNode, calloutTarget, serviceProvider } = this.props.vm;
    console.debug("NetworkView:render");
    // https://github.com/vasturiano/react-force-graph
    return (
      <>
        <Stack
          style={{
            boxShadow: "inset 0 0 10px #000000",
            background: "radial-gradient(circle, rgba(255,255,255,1) 0%,  rgba(220,228,236,1) 100%)",
          }}
        >
          <Stack verticalFill={false} style={{ position: "absolute", zIndex: 99999 }}>
            {!vm.errorText && (
              <StackItem shrink>
                <IconButton onClick={this.onFullScreen} iconProps={{ iconName: "FullScreen" }}></IconButton>
                <IconButton onClick={this.zoomToFit} iconProps={{ iconName: "Zoom" }}></IconButton>
              </StackItem>
            )}
            <StackItem styles={{ root: { paddingLeft: 20 } }}>
              <LoadProgress vm={vm} />
            </StackItem>
            {vm.errorText && (
              <StackItem shrink styles={{ root: { width: width - 80, padding: 10, margin: 20 } }}>
                <MessageBar messageBarType={MessageBarType.blocked} isMultiline={true}>
                  {vm.errorText}
                </MessageBar>
              </StackItem>
            )}
          </Stack>

          <ForceGraph2D
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={this.gref as any}
            width={width}
            height={height}
            graphData={vm.data}
            nodeLabel={this.nodeLabel}
            nodeCanvasObject={this.renderNode}
            linkCanvasObject={this.linkCanvasObject}
            enableZoomPanInteraction={true}
            onNodeHover={this.onHoverNode}
            onNodeClick={this.onNodeClick}
            onLinkHover={this.onLinkHover}
            onLinkClick={this.onLinkClick}
            onZoomEnd={this.onZoomEnd}
          />
        </Stack>

        {(currentNode || currentLink) && (
          <Callout
            target={calloutTarget}
            onDismiss={this.onCalloutDismiss}
            directionalHint={DirectionalHint.bottomCenter}
            setInitialFocus={true}
          >
            <RecordDetails node={currentNode} link={currentLink} serviceProvider={serviceProvider} />
            {currentLink &&
              currentLink.otherLinks &&
              currentLink.otherLinks.map((link, index) => (
                <>
                  <RecordDetails link={link} serviceProvider={serviceProvider} />
                </>
              ))}
          </Callout>
        )}
      </>
    );
  }
}

observer(NetworkViewPCF);
