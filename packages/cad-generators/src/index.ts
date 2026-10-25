import * as THREE from 'three';
import { MATERIAL_CATALOG, type UBIMFamilyAST } from '@nexusbim/bim-schema';

export function buildProceduralThreeGroup(ast: UBIMFamilyAST): THREE.Group {
  const root = new THREE.Group();
  const A = Number(ast.parameters.A?.value ?? 0.95);
  const B = Number(ast.parameters.B?.value ?? 0.15);
  const ZZYZX = Number(ast.parameters.ZZYZX?.value ?? 2.15);
  const frameThk = Number(ast.parameters.frameThk?.value ?? 0.05);
  const leafThk = Number(ast.parameters.leafThk?.value ?? 0.044);
  const swingDeg = Number(ast.parameters.swingAngle?.value ?? 45);
  const hasVision = Boolean(ast.parameters.hasVisionPanel?.value ?? true);

  const matPrimaryDef = MATERIAL_CATALOG[ast.materials.primary] ?? MATERIAL_CATALOG.oak_natural;
  const matSecondaryDef = MATERIAL_CATALOG[ast.materials.secondary] ?? MATERIAL_CATALOG.alu_anodized;
  const matGlassDef = MATERIAL_CATALOG[ast.materials.glazing] ?? MATERIAL_CATALOG.glass_low_e;

  const primaryMat = new THREE.MeshStandardMaterial({ color: matPrimaryDef.hex, roughness: matPrimaryDef.roughness, metalness: matPrimaryDef.metalness });
  const frameMat = new THREE.MeshStandardMaterial({ color: matSecondaryDef.hex, roughness: matSecondaryDef.roughness, metalness: matSecondaryDef.metalness });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: matGlassDef.hex, transparent: true, opacity: matGlassDef.opacity ?? 0.38, roughness: 0.08 });

  const leftJamb = new THREE.Mesh(new THREE.BoxGeometry(frameThk, ZZYZX, B), frameMat);
  leftJamb.position.set(frameThk / 2, ZZYZX / 2, B / 2);
  root.add(leftJamb);

  const rightJamb = new THREE.Mesh(new THREE.BoxGeometry(frameThk, ZZYZX, B), frameMat);
  rightJamb.position.set(A - frameThk / 2, ZZYZX / 2, B / 2);
  root.add(rightJamb);

  const headJamb = new THREE.Mesh(new THREE.BoxGeometry(A, frameThk, B), frameMat);
  headJamb.position.set(A / 2, ZZYZX - frameThk / 2, B / 2);
  root.add(headJamb);

  const leafWidth = Math.max(0.2, A - 2 * frameThk);
  const leafHeight = Math.max(0.4, ZZYZX - frameThk);
  const pivot = new THREE.Group();
  pivot.position.set(frameThk, 0, B / 2);
  pivot.rotation.y = THREE.MathUtils.degToRad(swingDeg);

  const leafMesh = new THREE.Mesh(new THREE.BoxGeometry(leafWidth, leafHeight, leafThk), primaryMat);
  leafMesh.position.set(leafWidth / 2, leafHeight / 2, 0);
  pivot.add(leafMesh);

  if (hasVision && ast.lod >= 300) {
    const visionMesh = new THREE.Mesh(new THREE.BoxGeometry(leafWidth * 0.25, leafHeight * 0.4, leafThk + 0.008), glassMat);
    visionMesh.position.set(leafWidth * 0.68, leafHeight * 0.62, 0);
    pivot.add(visionMesh);
  }
  root.add(pivot);

  for (const prim of ast.customPrimitives) {
    const geom = prim.shape === 'BLOCK' ? new THREE.BoxGeometry(prim.dx, prim.dz, prim.dy) : new THREE.CylinderGeometry(prim.dx / 2, prim.dx / 2, prim.dz, 24);
    const mesh = new THREE.Mesh(geom, frameMat);
    mesh.position.set(prim.ox + prim.dx / 2, prim.oz + prim.dz / 2, prim.oy + prim.dy / 2);
    root.add(mesh);
  }

  root.position.set(-A / 2, 0, -B / 2);
  return root;
}