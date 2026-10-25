import { create } from 'zustand';
import { createDefaultFamilyAST, type CustomCsgPrimitive, type LODLevel, type UBIMFamilyAST } from '@nexusbim/bim-schema';
import { compileFamilyToGdl, type CompiledGdlBundle } from '@nexusbim/gdl-compiler';
import { generateValueEngineeringReport, type VeAlternative, type VeAnalysisReport } from '@nexusbim/qs-ve-engine';

interface FamilyStudioState {
  ast: UBIMFamilyAST;
  past: UBIMFamilyAST[];
  future: UBIMFamilyAST[];
  compiled: CompiledGdlBundle;
  qsVeReport: VeAnalysisReport;
  shadingMode: 'pbr' | 'clay' | 'wireframe';
  setParameterValue: (paramId: string, value: number | boolean | string) => void;
  setMaterialSlot: (slot: keyof UBIMFamilyAST['materials'], materialId: string) => void;
  applyVeAlternative: (alt: VeAlternative) => void;
  setLod: (lod: LODLevel) => void;
  applyPreset: (presetName: string) => void;
  addCustomPrimitive: (prim: Omit<CustomCsgPrimitive, 'id'>) => void;
  undo: () => void;
  redo: () => void;
}

const initialAst = createDefaultFamilyAST('door');
function recompute(nextAst: UBIMFamilyAST) {
  return { ast: nextAst, compiled: compileFamilyToGdl(nextAst), qsVeReport: generateValueEngineeringReport(nextAst) };
}

export const useFamilyStore = create<FamilyStudioState>((set, get) => ({
  ...recompute(initialAst),
  past: [],
  future: [],
  shadingMode: 'pbr',
  setParameterValue: (paramId, value) => {
    const current = get().ast;
    const param = current.parameters[paramId];
    if (!param) return;
    const nextAst = { ...current, parameters: { ...current.parameters, [paramId]: { ...param, value } } };
    set({ past: [...get().past.slice(-25), current], future: [], ...recompute(nextAst) });
  },
  setMaterialSlot: (slot, materialId) => {
    const current = get().ast;
    const nextAst = { ...current, materials: { ...current.materials, [slot]: materialId } };
    set({ past: [...get().past.slice(-25), current], future: [], ...recompute(nextAst) });
  },
  applyVeAlternative: (alt) => {
    const current = get().ast;
    const nextParams = { ...current.parameters };
    if (alt.astPatch.parameterValues) {
      for (const [k, v] of Object.entries(alt.astPatch.parameterValues)) {
        if (nextParams[k]) nextParams[k] = { ...nextParams[k], value: v };
      }
    }
    const nextAst = { ...current, materials: { ...current.materials, ...(alt.astPatch.materials ?? {}) }, parameters: nextParams };
    set({ past: [...get().past.slice(-25), current], future: [], ...recompute(nextAst) });
  },
  setLod: (lod) => {
    const current = get().ast;
    set({ past: [...get().past.slice(-25), current], future: [], ...recompute({ ...current, lod }) });
  },
  applyPreset: (presetName) => {
    const current = get().ast;
    const preset = current.typePresets.find(p => p.name === presetName);
    if (!preset) return;
    const updatedParams = { ...current.parameters };
    for (const [k, v] of Object.entries(preset.values)) {
      if (updatedParams[k]) updatedParams[k] = { ...updatedParams[k], value: v };
    }
    set({ past: [...get().past.slice(-25), current], future: [], ...recompute({ ...current, activePresetName: presetName, parameters: updatedParams }) });
  },
  addCustomPrimitive: (prim) => {
    const current = get().ast;
    const nextAst = { ...current, customPrimitives: [...current.customPrimitives, { ...prim, id: 'csg_' + Date.now() }] };
    set({ past: [...get().past.slice(-25), current], future: [], ...recompute(nextAst) });
  },
  undo: () => {
    const { past, ast, future } = get();
    if (!past.length) return;
    set({ past: past.slice(0, -1), future: [ast, ...future], ...recompute(past[past.length - 1]) });
  },
  redo: () => {
    const { past, ast, future } = get();
    if (!future.length) return;
    set({ past: [...past, ast], future: future.slice(1), ...recompute(future[0]) });
  }
}));