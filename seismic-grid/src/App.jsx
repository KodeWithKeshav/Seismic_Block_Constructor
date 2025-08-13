import React, { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from "@react-three/drei";
import "./App.css";

const DEFAULT_COLORS = [
  "#4e79a7", "#f28e2b", "#e15759", "#76b7b2",
  "#59a14f", "#edc948", "#b07aa1", "#ff9da7"
];

function sortPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

// Horizontal layers stacked along Y
function LayerSlabs({ minX, maxX, minZ, maxZ, minY, thicknesses, colors }) {
  const sizeX = maxX - minX;
  const sizeZ = maxZ - minZ;
  let currentY = minY;

  return (
    <group>
      {thicknesses.map((t, i) => {
        const centerY = currentY + t / 2;
        const meshEl = (
          <mesh key={i} position={[minX + sizeX / 2, centerY, minZ + sizeZ / 2]}>
            <boxGeometry args={[sizeX, t, sizeZ]} />
            <meshStandardMaterial color={colors[i]} transparent opacity={0.9} />
          </mesh>
        );
        currentY += t;
        return meshEl;
      })}
    </group>
  );
}

function Scene({ params, setCameraView }) {
  const { x1, y1, z1, x2, y2, z2, thicknesses, colors } = params;
  const [minX, maxX] = sortPair(x1, x2);
  const [minY, maxY] = sortPair(y1, y2);
  const [minZ, maxZ] = sortPair(z1, z2);

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;

  const cameraRef = useRef();
  const controlsRef = useRef();

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(centerX, centerY, centerZ);
    }

    setCameraView({
      top: () => {
        cameraRef.current.position.set(centerX, maxY + sizeY * 2, centerZ);
        controlsRef.current.target.set(centerX, centerY, centerZ);
      },
      side: () => {
        cameraRef.current.position.set(centerX + sizeX * 2, centerY, centerZ);
        controlsRef.current.target.set(centerX, centerY, centerZ);
      },
      iso: () => {
        cameraRef.current.position.set(centerX + sizeX, centerY + sizeY, centerZ + sizeZ);
        controlsRef.current.target.set(centerX, centerY, centerZ);
      }
    });
  }, [centerX, centerY, centerZ, sizeX, sizeY, sizeZ, maxY, setCameraView]);

  return (
    <Canvas
      camera={{
        position: [centerX + sizeX, centerY + sizeY, centerZ + sizeZ],
        fov: 50
      }}
      onCreated={({ camera }) => (cameraRef.current = camera)}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[50, 50, 50]} intensity={1} />

      {/* Big centered grid on XZ plane */}
      <Grid
        args={[Math.max(sizeX, sizeZ) * 5, Math.max(sizeX, sizeZ) * 5]}
        position={[centerX, minY, centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        cellSize={1}
        cellThickness={0.5}
        sectionSize={5}
        sectionThickness={1}
        infiniteGrid={false}
      />

      {/* Layers */}
      <LayerSlabs
        minX={minX} maxX={maxX}
        minZ={minZ} maxZ={maxZ}
        minY={minY}
        thicknesses={thicknesses}
        colors={colors}
      />

      {/* Outer shell */}
      <mesh position={[centerX, centerY, centerZ]}>
        <boxGeometry args={[sizeX, sizeY, sizeZ]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.15} wireframe />
      </mesh>

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={["#ff4d4d", "#4dff4d", "#4da6ff"]} labelColor="white" />
      </GizmoHelper>

      <OrbitControls ref={controlsRef} target={[centerX, centerY, centerZ]} makeDefault />
    </Canvas>
  );
}

export default function App() {
  const [x1, setX1] = useState(0);
  const [y1, setY1] = useState(0);
  const [z1, setZ1] = useState(0);
  const [x2, setX2] = useState(10);
  const [y2, setY2] = useState(8);
  const [z2, setZ2] = useState(10);

  const [numLayers, setNumLayers] = useState(4);
  const [thicknesses, setThicknesses] = useState([2, 2, 2, 2]);
  const [colors, setColors] = useState(DEFAULT_COLORS.slice(0, 4));

  const cameraViews = useRef({});

  const updateThickness = (index, value) => {
    const newThick = [...thicknesses];
    newThick[index] = parseFloat(value);
    setThicknesses(newThick);
  };

  const updateColor = (index, value) => {
    const newColors = [...colors];
    newColors[index] = value;
    setColors(newColors);
  };

  useEffect(() => {
    setThicknesses(Array(numLayers).fill((y2 - y1) / numLayers));
    setColors(DEFAULT_COLORS.slice(0, numLayers));
  }, [numLayers, y1, y2]);

  return (
    <div className="app-container">
      <div className="sidebar">
        <h2>Seismic Layer View(BETA)</h2>

        <label>X1<input type="number" value={x1} onChange={(e) => setX1(+e.target.value)} /></label>
        <label>Y1<input type="number" value={y1} onChange={(e) => setY1(+e.target.value)} /></label>
        <label>Z1<input type="number" value={z1} onChange={(e) => setZ1(+e.target.value)} /></label>
        <label>X2<input type="number" value={x2} onChange={(e) => setX2(+e.target.value)} /></label>
        <label>Y2<input type="number" value={y2} onChange={(e) => setY2(+e.target.value)} /></label>
        <label>Z2<input type="number" value={z2} onChange={(e) => setZ2(+e.target.value)} /></label>

        <label>Number of Layers
          <input type="number" min="1" max="10" value={numLayers} onChange={(e) => setNumLayers(+e.target.value)} />
        </label>

        {thicknesses.map((t, i) => (
          <div key={i} className="layer-control">
            <label>Layer {i + 1} Thickness
              <input type="number" step="0.1" value={t} onChange={(e) => updateThickness(i, e.target.value)} />
            </label>
            <label>Layer {i + 1} Color
              <input type="color" value={colors[i]} onChange={(e) => updateColor(i, e.target.value)} />
            </label>
          </div>
        ))}

        <button onClick={() => cameraViews.current.top()}>Top View</button>
        <button onClick={() => cameraViews.current.side()}>Side View</button>
        <button onClick={() => cameraViews.current.iso()}>Isometric View</button>
      </div>

      <div className="viewport">
        <Scene
          params={{ x1, y1, z1, x2, y2, z2, thicknesses, colors }}
          setCameraView={(views) => (cameraViews.current = views)}
        />
      </div>
    </div>
  );
}
