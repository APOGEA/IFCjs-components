import { Component, UI, BaseSVGAnnotation } from "../../base-types";
import { Components, SimpleSVGViewport } from "../../core";
import { Button, Toolbar } from "../../ui";

export class DrawManager extends Component<string> implements UI {
  name: string = "DrawManager";
  uiElement!: {
    activationButton: Button;
    drawingTools: Toolbar;
  };
  viewport: SimpleSVGViewport;
  drawingTools: { [name: string]: BaseSVGAnnotation } = {};
  drawings: { [name: string]: SVGGElement } = {};
  private _enabled: boolean = false;
  private _isDrawing: boolean = false;
  private _components: Components;

  get isDrawing() {
    return this._isDrawing;
  }

  set isDrawing(value: boolean) {
    this._isDrawing = value;
  }

  get enabled() {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
    this.uiElement.activationButton.active = value;
    this.uiElement.drawingTools.visible = value;
    this.viewport.enabled = value;
  }

  constructor(components: Components) {
    super();
    this._components = components;
    this.viewport = new SimpleSVGViewport(components);
    this.setUI();
  }

  saveDrawing(name: string) {
    const currentDrawing = this.drawings[name];
    currentDrawing?.childNodes.forEach((child) =>
      currentDrawing.removeChild(child)
    );
    const drawing = this.viewport.getDrawing();
    const group =
      currentDrawing ??
      document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.id = name;
    group.append(...drawing);
    this.viewport.get().append(group);
    this.drawings[name] = group;
    return group;
  }

  addDrawingTool(name: string, tool: BaseSVGAnnotation) {
    const existingTool = this.drawingTools[name];
    if (!existingTool) {
      this.drawingTools[name] = tool;
    }
  }

  activateTool(tool: BaseSVGAnnotation) {
    const drawingTools = Object.values(this.drawingTools);
    drawingTools.forEach((tool) => (tool.enabled = false));
    tool.enabled = true;
  }

  get activeTool() {
    const drawingTools = Object.values(this.drawingTools);
    return drawingTools.find((tool) => tool.enabled === true);
  }

  private setUI() {
    const drawingTools = new Toolbar(this._components, { position: "top" });
    const activationButton = new Button(this._components, {
      materialIconName: "gesture",
    });
    activationButton.onclick = () => {
      this.enabled = !this.enabled;
    };
    this.uiElement = { drawingTools, activationButton };
  }

  get(): string {
    throw new Error("Method not implemented.");
  }
}