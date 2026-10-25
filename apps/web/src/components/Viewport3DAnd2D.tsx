import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildProceduralThreeGroup } from '@nexusbim/cad-generators';
import { useFamilyStore } from '../store/useFamilyStore';

export const Viewport3DAnd2D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const planCanvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const familyGroupRef = useRef<THREE.Group | null>(null);
  const ast = useFamilyStore((s) => s.ast);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b1120');
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.05, 100);
    camera.position.set(2.4, 2.2, 2.8);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.0, 0);
    scene.add(new THREE.GridHelper(6, 24, '#1e293b', '#0f172a'));
    scene.add(new THREE.AmbientLight('#ffffff', 0.8));
    const dirLight = new THREE.DirectionalLight('#ffffff', 1.4);
    dirLight.position.set(4, 6, 5);
    scene.add(dirLight);
    let reqId = 0;
    const animate = () => { reqId = requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
    animate();
    return () => { cancelAnimationFrame(reqId); renderer.dispose(); container.innerHTML = ''; };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (familyGroupRef.current) scene.remove(familyGroupRef.current);
    const group = buildProceduralThreeGroup(ast);
    familyGroupRef.current = group;
    scene.add(group);

    const canvas = planCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const A = Number(ast.parameters.A?.value ?? 0.9);
        const B = Number(ast.parameters.B?.value ?? 0.15);
        const frameThk = Number(ast.parameters.frameThk?.value ?? 0.05);
        const swingDeg = Number(ast.parameters.swingAngle?.value ?? 45);
        const scale = 110; const ox = 40; const oy = canvas.height - 35;
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
        ctx.strokeRect(ox, oy - B * scale, frameThk * scale, B * scale);
        ctx.strokeRect(ox + (A - frameThk) * scale, oy - B * scale, frameThk * scale, B * scale);
        const radius = (A - 2 * frameThk) * scale;
        const rad = (swingDeg * Math.PI) / 180;
        const px = ox + frameThk * scale; const py = oy - (B / 2) * scale;
        ctx.beginPath(); ctx.strokeStyle = '#f59e0b'; ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(-rad) * radius, py + Math.sin(-rad) * radius); ctx.stroke();
      }
    }
  }, [ast]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(15,23,42,0.92)', border: '1px solid #334155', borderRadius: 8, padding: 8 }}>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>2D GDL Plan Symbol (1:50)</div>
        <canvas ref={planCanvasRef} width={220} height={150} />
      </div>
    </div>
  );
};