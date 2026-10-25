export type FamilyCategoryId = 'door' | 'window' | 'column' | 'curtainwall' | 'furniture' | 'mep_valve';
export type LODLevel = 100 | 200 | 300 | 400;
export type GdlParamType = 'Length' | 'Angle' | 'RealNum' | 'Integer' | 'Boolean' | 'Material' | 'String';

export interface BimParameter {
  id: string;
  revitName: string;
  label: string;
  type: GdlParamType;
  value: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  formula?: string;
  isInstance: boolean;
}

export interface CustomCsgPrimitive {
  id: string;
  name: string;
  shape: 'BLOCK' | 'CYLIND';
  operation: 'ADDITIVE' | 'VOID';
  dx: number;
  dy: number;
  dz: number;
  ox: number;
  oy: number;
  oz: number;
  materialKey: string;
}

export interface FamilyTypePreset {
  name: string;
  values: Record<string, number | boolean | string>;
}

export interface MaterialDefinition {
  id: string;
  name: string;
  gdlSurfaceName: string;
  gdlIndex: number;
  hex: string;
  roughness: number;
  metalness: number;
  opacity?: number;
  densityKgM3: number;
  unitCostUsdPerM3: number;
  unitCostUsdPerM2: number;
  wasteFactorPct: number;
  embodiedCarbonKgCo2PerKg: number;
  annualMaintenanceUsdPerM2: number;
  serviceLifeYears: number;
  acousticBonusDb: number;
}

export interface UBIMFamilyAST {
  id: string;
  name: string;
  guid: string;
  category: FamilyCategoryId;
  lod: LODLevel;
  omniClassCode: string;
  omniClassTitle: string;
  uniclassCode: string;
  csiMasterFormat: string;
  ifcClass: string;
  ifcPredefinedType: string;
  parameters: Record<string, BimParameter>;
  materials: { primary: string; secondary: string; glazing: string; hardware: string };
  customPrimitives: CustomCsgPrimitive[];
  typePresets: FamilyTypePreset[];
  activePresetName: string;
}

export const MATERIAL_CATALOG: Record<string, MaterialDefinition> = {
  oak_natural: {
    id: 'oak_natural', name: 'Solid European White Oak', gdlSurfaceName: 'Wood - Oak Natural', gdlIndex: 14,
    hex: '#b88655', roughness: 0.62, metalness: 0.05, densityKgM3: 750, unitCostUsdPerM3: 2450, unitCostUsdPerM2: 112,
    wasteFactorPct: 7.5, embodiedCarbonKgCo2PerKg: 0.42, annualMaintenanceUsdPerM2: 4.8, serviceLifeYears: 30, acousticBonusDb: 35
  },
  engineered_core_veneer: {
    id: 'engineered_core_veneer', name: 'VE Acoustic Flaxboard Core + HPL Oak Veneer', gdlSurfaceName: 'Wood - Oak Veneer HPL', gdlIndex: 15,
    hex: '#a47548', roughness: 0.48, metalness: 0.04, densityKgM3: 580, unitCostUsdPerM3: 1480, unitCostUsdPerM2: 68,
    wasteFactorPct: 4.0, embodiedCarbonKgCo2PerKg: 0.28, annualMaintenanceUsdPerM2: 2.1, serviceLifeYears: 30, acousticBonusDb: 38
  },
  alu_anodized: {
    id: 'alu_anodized', name: 'Anodized Architectural Aluminum Dark Bronze', gdlSurfaceName: 'Metal - Aluminum Anodized Dark', gdlIndex: 28,
    hex: '#333942', roughness: 0.35, metalness: 0.85, densityKgM3: 2700, unitCostUsdPerM3: 9800, unitCostUsdPerM2: 165,
    wasteFactorPct: 5.0, embodiedCarbonKgCo2PerKg: 6.8, annualMaintenanceUsdPerM2: 1.5, serviceLifeYears: 40, acousticBonusDb: 2
  },
  galv_steel_powder: {
    id: 'galv_steel_powder', name: 'VE Pressed Galvanized Steel Powder-Coated', gdlSurfaceName: 'Metal - Steel Powder Coated', gdlIndex: 31,
    hex: '#475569', roughness: 0.42, metalness: 0.78, densityKgM3: 7850, unitCostUsdPerM3: 6200, unitCostUsdPerM2: 118,
    wasteFactorPct: 3.5, embodiedCarbonKgCo2PerKg: 2.15, annualMaintenanceUsdPerM2: 2.0, serviceLifeYears: 35, acousticBonusDb: 4
  },
  stainless_brushed: {
    id: 'stainless_brushed', name: 'Grade 316 Marine Brushed Stainless Steel', gdlSurfaceName: 'Metal - Stainless Steel 316', gdlIndex: 29,
    hex: '#cbd5e1', roughness: 0.22, metalness: 0.92, densityKgM3: 8000, unitCostUsdPerM3: 18500, unitCostUsdPerM2: 240,
    wasteFactorPct: 2.0, embodiedCarbonKgCo2PerKg: 4.4, annualMaintenanceUsdPerM2: 1.0, serviceLifeYears: 30, acousticBonusDb: 0
  },
  stainless_304_ve: {
    id: 'stainless_304_ve', name: 'VE Grade 304 Interior Brushed Stainless', gdlSurfaceName: 'Metal - Stainless Steel 304', gdlIndex: 30,
    hex: '#d1d5db', roughness: 0.25, metalness: 0.90, densityKgM3: 7900, unitCostUsdPerM3: 13200, unitCostUsdPerM2: 175,
    wasteFactorPct: 2.0, embodiedCarbonKgCo2PerKg: 3.6, annualMaintenanceUsdPerM2: 1.2, serviceLifeYears: 30, acousticBonusDb: 0
  },
  glass_low_e: {
    id: 'glass_low_e', name: 'Double Glazing 24mm Low-E Toughened', gdlSurfaceName: 'Glass - Clear Low-E', gdlIndex: 42,
    hex: '#7dd3fc', roughness: 0.08, metalness: 0.1, opacity: 0.38, densityKgM3: 2500, unitCostUsdPerM3: 4200, unitCostUsdPerM2: 145,
    wasteFactorPct: 3.0, embodiedCarbonKgCo2PerKg: 1.35, annualMaintenanceUsdPerM2: 3.2, serviceLifeYears: 25, acousticBonusDb: -2
  }
};

export function createDefaultFamilyAST(category: FamilyCategoryId = 'door'): UBIMFamilyAST {
  return {
    id: 'fam_' + category + '_01',
    name: 'Single_Flush_Vision_Door',
    guid: '3F2504E0-4F89-41D3-9A0C-0305E82C3301',
    category,
    lod: 300,
    omniClassCode: '23-17 11 13',
    omniClassTitle: 'Metal Doors and Frames',
    uniclassCode: 'Pr_30_59_24',
    csiMasterFormat: '08 14 16 - Flush Wood Doors',
    ifcClass: 'IfcDoor',
    ifcPredefinedType: 'DOOR',
    activePresetName: '950 x 2150 mm Custom Non-Modular',
    materials: { primary: 'oak_natural', secondary: 'alu_anodized', glazing: 'glass_low_e', hardware: 'stainless_brushed' },
    parameters: {
      A: { id: 'A', revitName: 'Width', label: 'Width (A)', type: 'Length', value: 0.95, min: 0.6, max: 1.8, step: 0.025, isInstance: false },
      B: { id: 'B', revitName: 'Depth', label: 'Frame Depth (B)', type: 'Length', value: 0.15, min: 0.08, max: 0.35, step: 0.01, isInstance: false },
      ZZYZX: { id: 'ZZYZX', revitName: 'Height', label: 'Height (ZZYZX)', type: 'Length', value: 2.15, min: 1.8, max: 3.0, step: 0.025, isInstance: false },
      frameThk: { id: 'frameThk', revitName: 'Frame_Thickness', label: 'Frame Jamb Thickness', type: 'Length', value: 0.05, min: 0.03, max: 0.1, step: 0.005, isInstance: false },
      leafThk: { id: 'leafThk', revitName: 'Leaf_Thickness', label: 'Door Leaf Thickness', type: 'Length', value: 0.044, min: 0.035, max: 0.065, step: 0.002, isInstance: false },
      swingAngle: { id: 'swingAngle', revitName: 'Swing_Angle', label: '2D/3D Opening Swing Angle', type: 'Angle', value: 45, min: 0, max: 180, step: 5, isInstance: true },
      hasVisionPanel: { id: 'hasVisionPanel', revitName: 'Has_Vision_Lite', label: 'Vision Glazing Panel', type: 'Boolean', value: true, isInstance: false }
    },
    customPrimitives: [],
    typePresets: [
      { name: '900 x 2100 mm Standard Modular', values: { A: 0.9, B: 0.15, ZZYZX: 2.1, frameThk: 0.05, swingAngle: 45 } },
      { name: '950 x 2150 mm Custom Non-Modular', values: { A: 0.95, B: 0.15, ZZYZX: 2.15, frameThk: 0.05, swingAngle: 45 } },
      { name: '1100 x 2400 mm Hospital Wide', values: { A: 1.1, B: 0.2, ZZYZX: 2.4, frameThk: 0.06, swingAngle: 90 } }
    ]
  };
}