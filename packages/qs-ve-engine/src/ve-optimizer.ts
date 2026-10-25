import type { UBIMFamilyAST } from '@nexusbim/bim-schema';
import { calculateFamilyQsTakeoff, type QsTakeoffSummary } from './qto-calculator';

export interface VeAlternative {
  id: string;
  title: string;
  category: 'Material Substitution' | 'Modular Geometry Standardization' | 'Hardware & Glazing Rationalization' | 'Full VE Package';
  rationale: string;
  capExUsd: number;
  capExSavingsUsd: number;
  capExSavingsPct: number;
  wholeLifeCost30YrUsd: number;
  lccSavingsUsd: number;
  embodiedCarbonKgCo2e: number;
  carbonReductionPct: number;
  functionScore: number;
  valueIndex: number;
  astPatch: {
    materials?: Partial<UBIMFamilyAST['materials']>;
    parameterValues?: Record<string, number | boolean | string>;
  };
}

export interface VeAnalysisReport {
  baseline: QsTakeoffSummary;
  baselineFunctionScore: number;
  alternatives: VeAlternative[];
}

function cloneAndApplyPatch(ast: UBIMFamilyAST, patch: VeAlternative['astPatch']): UBIMFamilyAST {
  const clonedParams = { ...ast.parameters };
  if (patch.parameterValues) {
    for (const [k, v] of Object.entries(patch.parameterValues)) {
      if (clonedParams[k]) clonedParams[k] = { ...clonedParams[k], value: v };
    }
  }
  return {
    ...ast,
    materials: { ...ast.materials, ...(patch.materials ?? {}) },
    parameters: clonedParams
  };
}

export function generateValueEngineeringReport(ast: UBIMFamilyAST): VeAnalysisReport {
  const baseline = calculateFamilyQsTakeoff(ast);
  const baselineFunctionScore = 88;
  const A = Number(ast.parameters.A?.value ?? 0.95);
  const ZZYZX = Number(ast.parameters.ZZYZX?.value ?? 2.15);
  const snappedA = Number((Math.round(A * 10) / 10).toFixed(2));
  const snappedZ = Number((Math.round(ZZYZX * 10) / 10).toFixed(2));

  const candidateSpecs = [
    {
      id: 've_opt_core_veneer',
      title: 'VE-01: Acoustic Engineered Flaxboard Core + HPL Oak Veneer',
      category: 'Material Substitution' as const,
      rationale: 'Replaces solid European White Oak core with certified acoustic flaxboard + HPL veneer (+3 dB Rw, lower waste & maintenance).',
      functionScore: 92,
      astPatch: { materials: { primary: 'engineered_core_veneer' } }
    },
    {
      id: 've_opt_frame_steel',
      title: 'VE-02: Pressed Galvanized Powder-Coated Frame & Grade 304 Hardware',
      category: 'Hardware & Glazing Rationalization' as const,
      rationale: 'Substitutes Dark Bronze Anodized Aluminum sub-frame with pressed galvanized steel and Grade 304 hardware.',
      functionScore: 87,
      astPatch: { materials: { secondary: 'galv_steel_powder', hardware: 'stainless_304_ve' } }
    },
    {
      id: 've_opt_modular_iso',
      title: 'VE-03: ISO 100mm Modular Dimension Standardization (' + Math.round(snappedA * 1000) + 'x' + Math.round(snappedZ * 1000) + 'mm)',
      category: 'Modular Geometry Standardization' as const,
      rationale: 'Snaps non-modular opening dimensions to the nearest ISO 100mm coordination grid to eliminate +14% bespoke labor surcharge.',
      functionScore: 90,
      astPatch: { parameterValues: { A: snappedA, ZZYZX: snappedZ } }
    },
    {
      id: 've_opt_combined_max',
      title: 'VE-04: Maximum Value Pareto Package (Core + Frame + Modular Grid)',
      category: 'Full VE Package' as const,
      rationale: 'Combines VE-01, VE-02, and VE-03 to maximize Value Index (VI) across CapEx, 30-Year LCC, and Embodied Carbon.',
      functionScore: 93,
      astPatch: {
        materials: { primary: 'engineered_core_veneer', secondary: 'galv_steel_powder', hardware: 'stainless_304_ve' },
        parameterValues: { A: snappedA, ZZYZX: snappedZ }
      }
    }
  ];

  const alternatives: VeAlternative[] = candidateSpecs.map((spec) => {
    const patchedAst = cloneAndApplyPatch(ast, spec.astPatch);
    const qto = calculateFamilyQsTakeoff(patchedAst);
    const capExSavingsUsd = Number((baseline.totalCapExUsd - qto.totalCapExUsd).toFixed(2));
    const capExSavingsPct = Number(((capExSavingsUsd / Math.max(1, baseline.totalCapExUsd)) * 100).toFixed(1));
    const lccSavingsUsd = Number((baseline.wholeLifeCost30YrUsd - qto.wholeLifeCost30YrUsd).toFixed(2));
    const carbonReductionPct = Number((((baseline.totalEmbodiedCarbonKgCo2e - qto.totalEmbodiedCarbonKgCo2e) / Math.max(1, baseline.totalEmbodiedCarbonKgCo2e)) * 100).toFixed(1));
    const relFunction = spec.functionScore / baselineFunctionScore;
    const relCost = qto.wholeLifeCost30YrUsd / Math.max(1, baseline.wholeLifeCost30YrUsd);
    const valueIndex = Number((relFunction / relCost).toFixed(2));

    return {
      id: spec.id,
      title: spec.title,
      category: spec.category,
      rationale: spec.rationale,
      capExUsd: qto.totalCapExUsd,
      capExSavingsUsd,
      capExSavingsPct,
      wholeLifeCost30YrUsd: qto.wholeLifeCost30YrUsd,
      lccSavingsUsd,
      embodiedCarbonKgCo2e: qto.totalEmbodiedCarbonKgCo2e,
      carbonReductionPct,
      functionScore: spec.functionScore,
      valueIndex,
      astPatch: spec.astPatch
    };
  });

  return { baseline, baselineFunctionScore, alternatives };
}