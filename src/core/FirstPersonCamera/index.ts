import { Component, Disposable, Event, Updateable } from "../../base-types";
import * as THREE from "three";
import {
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  Quaternion,
  Vector3,
} from "three";
import { Components } from "../Components";
import { InputCameraController } from "./InputCameraController";
// import { FirstPersonControls } from "three/examples/jsm/controls/FirstPersonControls";

const KEYS = {
  a: 65,
  s: 83,
  w: 87,
  d: 68,
  q: 81,
  e: 69,
  arrowLeft: 37,
  arrowUp: 38,
  arrowRight: 39,
  arrowDown: 40,
};

export class FirstPersonCamera
  extends Component<THREE.PerspectiveCamera | THREE.OrthographicCamera>
  implements Updateable, Disposable
{
  /** {@link Component.name} */
  name = "FirstPersonCamera";
  camera: PerspectiveCamera;
  input: InputCameraController;
  rotation: Quaternion;
  translation: Vector3;
  phi: { value: number; speed: number };
  theta: { value: number; speed: number };
  headTimer: number;
  objects: Mesh[];
  cameraHeight: number;
  isCollide: boolean;

  /** {@link Updateable.beforeUpdate} */
  readonly beforeUpdate: Event<FirstPersonCamera> =
    new Event<FirstPersonCamera>();

  /** {@link Updateable.afterUpdate} */
  readonly afterUpdate: Event<FirstPersonCamera> =
    new Event<FirstPersonCamera>();

  constructor(
    public components: Components,
    options: FirstPersonCameraOptions
  ) {
    super();

    this.camera = this.setupCamera();

    this.cameraHeight = options.cameraHeight;
    this.isCollide = options.isCollide;

    this.enabled = true;

    this.input = new InputCameraController();

    this.rotation = new Quaternion();
    this.translation = new Vector3(0, this.cameraHeight, 0);

    this.phi = {
      value: 0,
      speed: 8,
    };

    this.theta = {
      value: 0,
      speed: 4,
    };

    this.headTimer = 0;

    this.objects = components.meshes;

    components.scene.get().add(this.camera);

    this.setupEvents();
  }

  private setupCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(60, aspect, 1, 1000);
    camera.position.set(-100, this.cameraHeight, -100);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    return camera;
  }

  setupEvents() {
    window.addEventListener("resize", () => {
      if (this.components.renderer.isResizeable()) {
        const size = this.components.renderer.getSize();
        this.camera.aspect = size.width / size.height;
        this.camera.updateProjectionMatrix();
      }
    });
  }

  dispose(): void {}

  enabled: boolean;

  get(): PerspectiveCamera | OrthographicCamera {
    return this.camera;
  }

  update(timeElapsedS: number): void {
    if (this.enabled) {
      this.beforeUpdate.trigger(this);

      this.updateRotation();
      this.updateCamera();
      this.updateTranslation(timeElapsedS);

      this.input.update();

      this.afterUpdate.trigger(this);
    }
  }

  updateRotation() {
    const xh = this.input.current.mouseXDelta / window.innerWidth;
    const yh = this.input.current.mouseYDelta / window.innerHeight;

    this.phi.value += -xh * this.phi.speed;

    const clamp = (x: number, a: number, b: number) => {
      return Math.min(Math.max(x, a), b);
    };

    this.theta.value = clamp(
      this.theta.value + -yh * this.theta.speed,
      -Math.PI / 3,
      Math.PI / 3
    );

    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi.value);

    const qz = new THREE.Quaternion();
    qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta.value);

    const q = new THREE.Quaternion();
    q.multiply(quaternion);
    q.multiply(qz);

    this.rotation.copy(q);
  }

  updateCamera() {
    this.camera.quaternion.copy(this.rotation);
    this.camera.position.copy(this.translation);

    this.camera.position.y += this.cameraHeight;

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.rotation);
    forward.multiplyScalar(100);
    forward.add(this.translation);

    this.camera.lookAt(this.isCollide ? this.collideCalc(forward) : forward);
  }

  collideCalc(forward: THREE.Vector3) {
    const closest = forward.clone();

    // WIP collide calc
    // const dir = forward.clone();
    // let closest = forward;
    // let result: null = new THREE.Vector3();
    // result = null;
    //
    // let cast = this.components.raycaster.castRay();
    // // ----
    //
    // for (const obj of this.objects) {
    //   console.log('obj', obj);
    // }

    return closest;
  }

  updateTranslation(timeElapsedS: number) {
    const { forwardVelocity, lateralVelocity, elevationVelocity } =
      this.movesFromInput();

    const isRotatingLeft = this.input.key(KEYS.arrowLeft);

    if (isRotatingLeft) {
      this.phi.value += (timeElapsedS * this.phi.speed) / 3;
    }

    const isRotatingRight = this.input.key(KEYS.arrowRight);

    if (isRotatingRight) {
      this.phi.value -= (timeElapsedS * this.phi.speed) / 3;
    }

    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi.value);

    const quaternionMultiply = (movement: THREE.Vector3, velocity: number) => {
      movement.applyQuaternion(quaternion);
      movement.multiplyScalar(velocity * timeElapsedS * 10);
    };

    const forward = new THREE.Vector3(0, 0, -1);
    quaternionMultiply(forward, forwardVelocity);

    const lateral = new THREE.Vector3(-1, 0, 0);
    quaternionMultiply(lateral, lateralVelocity);

    const elevation = new THREE.Vector3(0, -1, 0);
    quaternionMultiply(elevation, elevationVelocity);

    this.translation.add(forward);
    this.translation.add(lateral);
    this.translation.add(elevation);
  }

  movesFromInput() {
    const forwardVelocity =
      (this.input.key(KEYS.w) || this.input.key(KEYS.arrowUp) ? 1 : 0) +
      (this.input.key(KEYS.s) || this.input.key(KEYS.arrowDown) ? -1 : 0);

    const lateralVelocity =
      (this.input.key(KEYS.a) ? 1 : 0) + (this.input.key(KEYS.d) ? -1 : 0);

    const elevationVelocity = this.input.key(KEYS.e)
      ? 1
      : this.input.key(KEYS.q)
      ? -1
      : 0;

    return {
      forwardVelocity,
      lateralVelocity,
      elevationVelocity,
    };
  }
}
