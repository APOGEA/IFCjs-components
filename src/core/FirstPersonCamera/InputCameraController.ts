export class InputCameraController {
  target: Document = document;
  previous: any = null;
  keys: any = {};
  previousKeys: any = {};

  current: {
    leftButton: boolean;
    rightButton: boolean;
    mouseXDelta: number;
    mouseYDelta: number;
    mouseX: number;
    mouseY: number;
  } = {
    leftButton: false,
    rightButton: false,
    mouseXDelta: 0,
    mouseYDelta: 0,
    mouseX: 0,
    mouseY: 0,
  };

  constructor() {
    this.target.addEventListener(
      "mousedown",
      (e) => this.onMouseDown(e),
      false
    );

    this.target.addEventListener(
      "mousemove",
      (e) => this.onMouseMove(e),
      false
    );

    this.target.addEventListener("mouseup", (e) => this.onMouseUp(e), false);
    this.target.addEventListener("keydown", (e) => this.onKeyDown(e), false);
    this.target.addEventListener("keyup", (e) => this.onKeyUp(e), false);
  }

  onMouseMove(e: any) {
    this.current.mouseX = e.pageX - window.innerWidth / 2;
    this.current.mouseY = e.pageY - window.innerHeight / 2;

    if (this.previous === null) {
      this.previous = { ...this.current };
    }

    this.current.mouseXDelta = this.current.mouseX - this.previous.mouseX;
    this.current.mouseYDelta = this.current.mouseY - this.previous.mouseY;
  }

  onMouseDown(e: any) {
    this.onMouseMove(e);

    switch (e.button) {
      case 0: {
        this.current.leftButton = true;
        break;
      }
      case 2: {
        this.current.rightButton = true;
        break;
      }
    }
  }

  onMouseUp(e: any) {
    this.onMouseMove(e);

    switch (e.button) {
      case 0: {
        this.current.leftButton = false;
        break;
      }
      case 2: {
        this.current.rightButton = false;
        break;
      }
    }
  }

  onKeyDown(e: any) {
    this.keys[e.keyCode] = true;
  }

  onKeyUp(e: any) {
    this.keys[e.keyCode] = false;
  }

  key(keyCode: string | number) {
    return !!this.keys[keyCode];
  }

  update() {
    if (this.previous !== null) {
      this.current.mouseXDelta = this.current.mouseX - this.previous.mouseX;
      this.current.mouseYDelta = this.current.mouseY - this.previous.mouseY;

      this.previous = { ...this.current };
    }
  }
}
