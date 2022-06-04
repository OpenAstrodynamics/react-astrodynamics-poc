import {
  Line,
  OrbitControls,
  PerspectiveCamera,
  Sphere,
  Stats,
  useTexture,
  Text,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  DefaultXRControllers,
  useController,
  useXR,
  useXRFrame,
  VRCanvas,
} from "@react-three/xr";
import { createInterpolatorWithFallback } from "commons-math-interpolation";
import { button, buttonGroup, useControls } from "leva";
import { Suspense, useEffect, useRef } from "react";
import { Color, Mesh, TextureFilter, Vector3 } from "three";
import create from "zustand";
import "./App.css";
import GMAT from "./GMAT.json";
import { evalpoly } from "./math";
import { skyBoxTexture } from "./skyBoxAssets";

interface Trajectory {
  epochs: Array<number>;
  vectors: Array<Array<number>>;
}

interface Data {
  trajectories: {
    [index: string]: Trajectory;
  };
  ephemerides: {
    [index: string]: Trajectory;
  };
}

const prepareTrajectoryData = (input: Trajectory) => {
  const x = input.vectors.map((v) => v[0] * 1e3);
  // Swap Y and Z axis
  const y = input.vectors.map((v) => v[2] * 1e3);
  const z = input.vectors.map((v) => v[1] * 1e3);
  const vectors = input.vectors.map((v) => [
    v[0] * 1e3,
    v[2] * 1e3,
    v[1] * 1e3,
  ]);
  const interpolationMethod = "akima";
  const xInterpolator = createInterpolatorWithFallback(
    interpolationMethod,
    input.epochs,
    x
  );
  const yInterpolator = createInterpolatorWithFallback(
    interpolationMethod,
    input.epochs,
    y
  );
  const zInterpolator = createInterpolatorWithFallback(
    interpolationMethod,
    input.epochs,
    z
  );
  return {
    epochs: input.epochs,
    x: x,
    y: y,
    z: z,
    xInterpolator: xInterpolator,
    yInterpolator: yInterpolator,
    zInterpolator: zInterpolator,
    vectors: vectors as Array<[number, number, number]>,
  };
};

type Store = {
  running: boolean;
  toggleRunning: () => void;
  stop: () => void;
  exponent: number;
  increaseExponent: () => void;
  decreaseExponent: () => void;
  resetExponent: () => void;
  time: number;
  setTime: (time: number) => void;
  resetTime: () => void;
  tEnd: number;
};

const factor = (exponent: number) => {
  return exponent >= 0
    ? Math.pow(10, exponent)
    : -Math.pow(10, Math.abs(exponent) - 1);
};

const clamp = (num: number, min: number, max: number) =>
  Math.min(Math.max(num, min), max);

const useStore = create<Store>((set) => ({
  running: false,
  toggleRunning: () =>
    set((state) => {
      return { running: !state.running };
    }),
  stop: () =>
    set(() => {
      return { running: false };
    }),
  exponent: 0,
  increaseExponent: () =>
    set((state) => {
      return { exponent: state.exponent + 1 };
    }),
  decreaseExponent: () =>
    set((state) => {
      return { exponent: state.exponent - 1 };
    }),
  resetExponent: () =>
    set(() => {
      return { exponent: 0 };
    }),
  time: 0,
  setTime: (newTime) =>
    set(() => {
      return { time: newTime };
    }),
  resetTime: () =>
    set(() => {
      return { time: 0 };
    }),
  tEnd: 0,
}));

const fps = 60;
const step = Math.round((1 / fps) * 1000);

setInterval(() => {
  const time = useStore.getState().time;
  const tEnd = useStore.getState().tEnd;
  const exponent = useStore.getState().exponent;
  const running = useStore.getState().running;
  const toggleRunning = useStore.getState().toggleRunning;
  const dt = (step / 1000) * factor(exponent);
  const newTime = clamp(time + dt, 0, tEnd);
  if (running) {
    if (time + dt !== newTime) {
      toggleRunning();
    }
    useStore.setState({ time: newTime });
  }
}, step);

interface BodyProps {
  ephemeris: Trajectory;
}

const Earth = () => {
  const [colorMap] = useTexture(["textures/Earth-color.jpg"]);
  const ref = useRef<Mesh>();

  const { scene } = useThree();

  const meanRadius = 6371.008366666666;
  const polarRadius = 6356.7519;
  const equatorialRadius = 6378.1366;
  const yScale = polarRadius / meanRadius;
  const xzScale = equatorialRadius / meanRadius;
  const scale = new Vector3(xzScale, yScale, xzScale);
  useXRFrame(() => {
    if (ref.current) {
      const newScale = new Vector3().multiplyVectors(scale, scene.scale);
      ref.current.scale.set(newScale.x, newScale.y, newScale.z);
    }
  });
  return (
    <>
      <Sphere ref={ref} args={[meanRadius * 1e3, 1000, 1000]} scale={new Vector3().multiplyVectors(scale, scene.scale)}>
        <meshStandardMaterial map={colorMap} />
      </Sphere>
    </>
  );
};

const Moon = ({ ephemeris }: BodyProps) => {
  const [colorMap, displacementMap, normalMap] = useTexture([
    "textures/Moon-color2.jpg",
    "textures/Moon-displacement.jpg",
    "textures/Moon-normal.jpg",
  ]);

  const meanRadius = 1737.4;
  const polarRadius = 1737.4;
  const equatorialRadius = 1737.4;
  const yScale = polarRadius / meanRadius;
  const xzScale = equatorialRadius / meanRadius;
  const scale = new Vector3(xzScale, yScale, xzScale);
  const epoch0 = ephemeris.epochs[0];
  const data = prepareTrajectoryData(ephemeris);
  const ref = useRef<Mesh>();
  const timeRef = useRef(useStore.getState().time);
  useEffect(
    () =>
      useStore.subscribe(
        (time: number) => (timeRef.current = time),
        (state) => state.time
      ),
    []
  );
  useFrame(() => {
    const epoch = epoch0 + timeRef.current / 86400;
    const x = data.xInterpolator(epoch);
    const y = data.yInterpolator(epoch);
    const z = data.zInterpolator(epoch);
    if (ref.current) {
      ref.current.position.x = x;
      ref.current.position.y = y;
      ref.current.position.z = z;
    }
  });

  return (
    <>
      <Sphere
        ref={ref}
        args={[meanRadius * 1e3, 1000, 1000]}
        scale={scale}
        position={data.vectors[0]}
      >
        <meshStandardMaterial
          displacementScale={100000}
          map={colorMap}
          normalMap={normalMap}
          displacementMap={displacementMap}
        />
      </Sphere>
      <Line
        points={data.vectors}
        color={new Color("gray")}
        lineWidth={1}
        dashed={false}
        skinning={true}
      />
    </>
  );
};

function SkyBox() {
  const { Background } = useControls({
    Background: {
      value: "plain",
      options: ["plain", "grid", "figures", "bounds"],
    },
  });
  const { scene } = useThree();
  scene.background = skyBoxTexture(Background);
  return <></>;
}

interface SCProps {
  trajectory: Trajectory;
}

const Spacecraft = ({ trajectory }: SCProps) => {
  const ref = useRef<Mesh>();
  const color = new Color("blue");
  const scColor = new Color("cyan");
  const epoch0 = trajectory.epochs[0];
  const data = prepareTrajectoryData(trajectory);
  const timeRef = useRef(useStore.getState().time);
  useEffect(
    () =>
      useStore.subscribe(
        (time: number) => (timeRef.current = time),
        (state) => state.time
      ),
    []
  );
  useFrame(() => {
    const epoch = epoch0 + timeRef.current / 86400;
    const x = data.xInterpolator(epoch);
    const y = data.yInterpolator(epoch);
    const z = data.zInterpolator(epoch);
    if (ref.current) {
      ref.current.position.x = x;
      ref.current.position.y = y;
      ref.current.position.z = z;
    }
  });
  return (
    <>
      <Line
        points={data.vectors}
        color={color}
        lineWidth={1}
        dashed={false}
        skinning={true}
      />
      <Sphere ref={ref} args={[1e6, 100, 100]} position={data.vectors[0]}>
        <meshBasicMaterial color={scColor} />
      </Sphere>
    </>
  );
};

interface SceneProps {
  data: Data;
}

function Scene({ data }: SceneProps) {
  const epochs = data.trajectories["S/C"].epochs;
  const tEnd = Math.round((epochs[epochs.length - 1] - epochs[0]) * 86400);
  useStore.setState({ tEnd: tEnd });
  const toggleRunning = useStore((state) => state.toggleRunning);
  const resetTime = useStore((state) => state.resetTime);
  const increaseExponent = useStore((state) => state.increaseExponent);
  const decreaseExponent = useStore((state) => state.decreaseExponent);
  const resetExponent = useStore((state) => state.resetExponent);
  const [, set] = useControls(() => ({
    Run: button(() => toggleRunning()),
    Epoch: {
      value: 0.0,
      min: 0.0,
      max: tEnd,
      step: 1.0,
      onChange: () => {},
    },
    Factor: {
      value: "1x",
      onChange: () => set({ Factor: factor(useStore.getState().exponent) }),
    },
    ExponentGroup: buttonGroup({
      label: "",
      opts: {
        "-": () => decreaseExponent(),
        "1x": () => resetExponent(),
        "+": () => increaseExponent(),
      },
    }),
    Reset: button(() => resetTime()),
  }));
  useStore.subscribe(
    (time) => set({ Epoch: time }),
    (state) => state.time
  );
  useStore.subscribe(
    (exponent: number) => set({ Factor: `${factor(exponent)}x` }),
    (state) => state.exponent
  );
  const { player } = useXR();
  const { camera, scene } = useThree();

  const controller = useController("right");
  const textRef = useRef("hello world");
  useStore.subscribe(
    (time: number) => {
      textRef.current = time.toString()
    },
    (state) => state.time
  );
  const textMeshRef = useRef<Mesh>();
  const scale = new Vector3(10e6, 10e6, 10e6)
  useXRFrame((time, frame) => {
    console.log(time, frame)
    scene.scale.set(
      2.857142857142857e-7,
      2.857142857142857e-7,
      2.857142857142857e-7
    );
    // console.log(controller?.inputSource.gamepad.axes);
    // if (textRef.current) {
      // const str = controller?.inputSource.gamepad.axes.toString() ?? "none";
      // console.log(str)
      // textRef.current = str
      // console.log(textRef.current)
    // }
    if (textMeshRef.current) {
      const newScale = new Vector3().multiplyVectors(scale, scene.scale);
      textMeshRef.current.scale.set(newScale.x, newScale.y, newScale.z);
    }
    // if (textMeshRef.current) {
    //   textMeshRef.current.scale.set(
    //     scene.scale.x,
    //     scene.scale.y,
    //     scene.scale.z
    //   );
    // }
  });
  return (
    <>
      <OrbitControls />
      <Earth />
      <Text
        ref={textMeshRef}
        color="white"
        anchorX="center"
        anchorY="middle"
        fontSize={1}
        position={[0, 0, 0]}
        scale={new Vector3().multiplyVectors(scale, scene.scale)}
      >
        {textRef.current}
      </Text>
      {/* <Moon ephemeris={data.ephemerides.moon} />
      <Spacecraft trajectory={data.trajectories["S/C"]} /> */}
      <PerspectiveCamera makeDefault position={[0, 0, 7e7]} far={1e24} />
      {/* <axesHelper args={[1e9]} /> */}
      <ambientLight intensity={0.5} />
      <group position={[0, 0, 4]}>
        <primitive object={camera} />
      </group>
      <SkyBox />
    </>
  );
}

function App() {
  return (
    <div className="App">
      {/* <Canvas gl={{ logarithmicDepthBuffer: true }}> */}
      <VRCanvas>
        <DefaultXRControllers />
        <Stats showPanel={0} className="stats" />
        <Suspense fallback={null}>
          <Scene data={GMAT} />
        </Suspense>
      </VRCanvas>
      {/* </Canvas> */}
    </div>
  );
}

export default App;
