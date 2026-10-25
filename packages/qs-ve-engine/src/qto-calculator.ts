import { MATERIAL_CATALOG, type UBIMFamilyAST } from '@nexusbim/bim-schema';

export interface BoqLineItem {
  code: string;
  description: string;
  unit: 'm3' | 'm2' | 'm' | 'kg' | 'set';
  netQuantity: number;
  wastePercent: number;
  grossQuantity: number;
  materialRateUsd: number;
  laborPlantRateUsd: number;
  unitRateTotalUsd: number;
  totalCostUsd: number;
  massKg: number;
  embodiedCarbonKgCo2e: number;
}

export interface QsTakeoffSummary {
  familyId: string;
  familyName: string;
  csiMasterFormat: string;
  uniclassCode: string;
  lineItems: BoqLineItem[];
  subtotalDirectCostUsd: number;
  preliminariesAndOhpUsd: number;
  totalCapExUsd: number;
  totalMassKg: number;
  totalEmbodiedCarbonKgCo2e: number;
  npv30YrMaintenanceUsd: number;
  wholeLifeCost30YrUsd: number;
  isModularDimension: boolean;
  nonModularSurchargePct: number;
}

export function calculateFamilyQsTakeoff(ast: UBIMFamilyAST): QsTakeoffSummary {
  const A = Number(ast.parameters.A?.value ?? 0.95);
  const B = Number(ast.parameters.B?.value ?? 0.15);
  const ZZYZX = Number(ast.parameters.ZZYZX?.value ?? 2.15);
  const frameThk = Number(ast.parameters.frameThk?.value ?? 0.05);
  const leafThk = Number(ast.parameters.leafThk?.value ?? 0.044);
  const hasVision = Boolean(ast.parameters.hasVisionPanel?.value ?? true);

  const matLeaf = MATERIAL_CATALOG[ast.materials.primary] ?? MATERIAL_CATALOG.oak_natural;
  const matFrame = MATERIAL_CATALOG[ast.materials.secondary] ?? MATERIAL_CATALOG.alu_anodized;
  const matGlass = MATERIAL_CATALOG[ast.materials.glazing] ?? MATERIAL_CATALOG.glass_low_e;
  const matHw = MATERIAL_CATALOG[ast.materials.hardware] ?? MATERIAL_CATALOG.stainless_brushed;

  const isWidthModular = Math.abs(Math.round(A * 10) - A * 10) < 0.001;
  const isHeightModular = Math.abs(Math.round(ZZYZX * 10) - ZZYZX * 10) < 0.001;
  const isModularDimension = isWidthModular && isHeightModular;
  const nonModularSurchargePct = isModularDimension ? 0 : 14;

  const frameVolNet = (2 * (frameThk * B * ZZYZX)) + (A * B * frameThk);
  const frameWastePct = matFrame.wasteFactorPct + (isModularDimension ? 0 : 3.5);
  const frameVolGross = frameVolNet * (1 + frameWastePct / 100);
  const frameMassKg = frameVolGross * matFrame.densityKgM3 * 0.22;

  const leafWidth = Math.max(0.2, A - 2 * frameThk);
  const leafHeight = Math.max(0.5, ZZYZX - frameThk);
  const rawLeafArea = leafWidth * leafHeight;
  const visionArea = hasVision ? (leafWidth * 0.25) * (leafHeight * 0.38) : 0;
  const netLeafArea = Math.max(0.1, rawLeafArea - visionArea);
  const leafWastePct = matLeaf.wasteFactorPct + (isModularDimension ? 0 : 4.5);
  const grossLeafArea = netLeafArea * (1 + leafWastePct / 100);
  const leafMassKg = grossLeafArea * leafThk * matLeaf.densityKgM3;

  const grossVisionArea = visionArea * (1 + matGlass.wasteFactorPct / 100);
  const glassMassKg = grossVisionArea * 0.024 * matGlass.densityKgM3;
  const sealLengthNet = (2 * ZZYZX) + A;
  const sealLengthGross = sealLengthNet * 1.05;
  const laborMultiplier = 1 + nonModularSurchargePct / 100;

  const lineItems: BoqLineItem[] = [
    {
      code: 'NRM2-23.1.1',
      description: 'Perimeter Sub-Frame & Architrave (' + matFrame.name + ')',
      unit: 'kg',
      netQuantity: Number((frameVolNet * matFrame.densityKgM3 * 0.22).toFixed(2)),
      wastePercent: Number(frameWastePct.toFixed(1)),
      grossQuantity: Number(frameMassKg.toFixed(2)),
      materialRateUsd: 5.4,
      laborPlantRateUsd: Number((2.8 * laborMultiplier).toFixed(2)),
      unitRateTotalUsd: Number((5.4 + 2.8 * laborMultiplier).toFixed(2)),
      totalCostUsd: Number((frameMassKg * (5.4 + 2.8 * laborMultiplier)).toFixed(2)),
      massKg: Number(frameMassKg.toFixed(2)),
      embodiedCarbonKgCo2e: Number((frameMassKg * matFrame.embodiedCarbonKgCo2PerKg).toFixed(2))
    },
    {
      code: 'NRM2-23.2.1',
      description: 'Acoustic Core Door Leaf (' + matLeaf.name + ')',
      unit: 'm2',
      netQuantity: Number(netLeafArea.toFixed(3)),
      wastePercent: Number(leafWastePct.toFixed(1)),
      grossQuantity: Number(grossLeafArea.toFixed(3)),
      materialRateUsd: matLeaf.unitCostUsdPerM2,
      laborPlantRateUsd: Number((42 * laborMultiplier).toFixed(2)),
      unitRateTotalUsd: Number((matLeaf.unitCostUsdPerM2 + 42 * laborMultiplier).toFixed(2)),
      totalCostUsd: Number((grossLeafArea * (matLeaf.unitCostUsdPerM2 + 42 * laborMultiplier)).toFixed(2)),
      massKg: Number(leafMassKg.toFixed(2)),
      embodiedCarbonKgCo2e: Number((leafMassKg * matLeaf.embodiedCarbonKgCo2PerKg).toFixed(2))
    }
  ];

  if (hasVision && visionArea > 0) {
    lineItems.push({
      code: 'NRM2-23.3.2',
      description: 'Factory-Glazed Vision Lite (' + matGlass.name + ')',
      unit: 'm2',
      netQuantity: Number(visionArea.toFixed(3)),
      wastePercent: matGlass.wasteFactorPct,
      grossQuantity: Number(grossVisionArea.toFixed(3)),
      materialRateUsd: matGlass.unitCostUsdPerM2,
      laborPlantRateUsd: 35,
      unitRateTotalUsd: matGlass.unitCostUsdPerM2 + 35,
      totalCostUsd: Number((grossVisionArea * (matGlass.unitCostUsdPerM2 + 35)).toFixed(2)),
      massKg: Number(glassMassKg.toFixed(2)),
      embodiedCarbonKgCo2e: Number((glassMassKg * matGlass.embodiedCarbonKgCo2PerKg).toFixed(2))
    });
  }

  const hwBaseCost = matHw.id === 'stainless_brushed' ? 185 : 128;
  lineItems.push(
    {
      code: 'NRM2-23.4.1',
      description: 'Architectural Ironmongery Set (' + matHw.name + ')',
      unit: 'set',
      netQuantity: 1,
      wastePercent: 0,
      grossQuantity: 1,
      materialRateUsd: hwBaseCost,
      laborPlantRateUsd: 45,
      unitRateTotalUsd: hwBaseCost + 45,
      totalCostUsd: hwBaseCost + 45,
      massKg: 4.2,
      embodiedCarbonKgCo2e: Number((4.2 * matHw.embodiedCarbonKgCo2PerKg).toFixed(2))
    },
    {
      code: 'NRM2-23.5.1',
      description: 'Dual Intumescent Fire & Smoke Perimeter Seal (FD30S)',
      unit: 'm',
      netQuantity: Number(sealLengthNet.toFixed(2)),
      wastePercent: 5.0,
      grossQuantity: Number(sealLengthGross.toFixed(2)),
      materialRateUsd: 8.5,
      laborPlantRateUsd: 4.0,
      unitRateTotalUsd: 12.5,
      totalCostUsd: Number((sealLengthGross * 12.5).toFixed(2)),
      massKg: Number((sealLengthGross * 0.18).toFixed(2)),
      embodiedCarbonKgCo2e: Number((sealLengthGross * 0.45).toFixed(2))
    }
  );

  const subtotalDirectCostUsd = Number(lineItems.reduce((sum, item) => sum + item.totalCostUsd, 0).toFixed(2));
  const preliminariesAndOhpUsd = Number((subtotalDirectCostUsd * 0.15).toFixed(2));
  const totalCapExUsd = Number((subtotalDirectCostUsd + preliminariesAndOhpUsd).toFixed(2));
  const totalMassKg = Number(lineItems.reduce((sum, item) => sum + item.massKg, 0).toFixed(2));
  const totalEmbodiedCarbonKgCo2e = Number(lineItems.reduce((sum, item) => sum + item.embodiedCarbonKgCo2e, 0).toFixed(2));
  const annualMaint = netLeafArea * matLeaf.annualMaintenanceUsdPerM2 + visionArea * matGlass.annualMaintenanceUsdPerM2 + 8.5;
  const npv30YrMaintenanceUsd = Number((annualMaint * 18.392).toFixed(2));
  const wholeLifeCost30YrUsd = Number((totalCapExUsd + npv30YrMaintenanceUsd).toFixed(2));

  return {
    familyId: ast.id,
    familyName: ast.name,
    csiMasterFormat: ast.csiMasterFormat,
    uniclassCode: ast.uniclassCode,
    lineItems,
    subtotalDirectCostUsd,
    preliminariesAndOhpUsd,
    totalCapExUsd,
    totalMassKg,
    totalEmbodiedCarbonKgCo2e,
    npv30YrMaintenanceUsd,
    wholeLifeCost30YrUsd,
    isModularDimension,
    nonModularSurchargePct
  };
}