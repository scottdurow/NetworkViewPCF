/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import "@babel/polyfill";
import { initializeIcons } from "@uifabric/icons";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { NetworkViewPCF } from "./Views/NetworkViewPCF";
import { NetworkViewModel } from "./ViewModels/NetworkViewModel";
import { NetworkViewServiceProvider } from "./NetworkViewServiceProvider";
import { ControlContextService } from "../Services/BaseServices/ControlContextService";
initializeIcons(undefined, { disableWarnings: true });
export class NetworkView implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  _serviceProvider: NetworkViewServiceProvider;
  _container: HTMLDivElement;
  _context: ComponentFramework.Context<IInputs>;
  _entityTypeName: string;
  _entityId: string;
  _loaded = false;
  _vm: NetworkViewModel;
  _notifyOutputChanged: () => void;
  _controlContextService: ControlContextService;

  /**
   * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
   * Data-set values are not initialized here, use updateView.
   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
   * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
   * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
   * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
   */
  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement,
  ) {
    // Add control initialization code
    this._container = container;
    this._context = context;
    this._context.mode.trackContainerResize(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._entityTypeName = (context as any).page.entityTypeName as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._entityId = (context as any).mode.contextInfo.entityId;
    this._notifyOutputChanged = notifyOutputChanged;
    context.mode.trackContainerResize(true);

    this._serviceProvider = new NetworkViewServiceProvider(this._context);
    this._controlContextService = this._serviceProvider.GetControlContextService();
    this._vm = new NetworkViewModel(this._serviceProvider);

    // Register a mouse move event on the window so we can get the real mouse coordinates for hover event on canvas
    this._container.addEventListener("mousemove", (ev: MouseEvent) => {
      this._vm.mouseX = ev.x;
      this._vm.mouseY = ev.y;
    });
  }

  /**
   * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
   */
  public updateView(context: ComponentFramework.Context<IInputs>): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._entityTypeName = (context as any).mode.contextInfo.entityTypeName;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._entityId = (context as any).mode.contextInfo.entityId;

    if (context.updatedProperties && context.updatedProperties.length > 0) {
      this._controlContextService.onPCFUpdate(context, context.updatedProperties).then(() => {
        this.renderControl();
      });
    } else {
      this.renderControl();
    }
  }

  /**
   * It is called by the framework prior to a control receiving new data.
   * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
   */
  public getOutputs(): IOutputs {
    return {};
  }

  /**
   * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
   * i.e. cancelling any pending remote calls, removing listeners, etc.
   */
  public destroy(): void {
    ReactDOM.unmountComponentAtNode(this._container);
  }

  private renderControl() {
    let configuredHeight = 400;
    if (this._context.parameters.height && this._context.parameters.height.raw) {
      configuredHeight = this._context.parameters.height.raw;
    }
    ReactDOM.render(
      React.createElement(NetworkViewPCF, {
        vm: this._vm,
        width: this._context.mode.allocatedWidth,
        height: this._context.mode.allocatedHeight == -1 ? configuredHeight : this._context.mode.allocatedHeight,
      }),
      this._container,
    );
  }
}
