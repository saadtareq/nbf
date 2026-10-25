import { MATERIAL_CATALOG, type UBIMFamilyAST } from '@nexusbim/bim-schema';
import { calculateFamilyQsTakeoff } from '@nexusbim/qs-ve-engine';
import { transpileRevitFormulaToGdl } from './formula-transpiler';
import { validateGdlTransformationStack, type StackDiagnostic } from './stack-validator';

export interface CompiledGdlBundle {
  masterScript: string;
  script3d: string;
  script2d: string;
  propertiesScript5D: string;
  parameterSummary: string;
  lpXmlSource: string;
  diagnostics: StackDiagnostic;
}

export function compileFamilyToGdl(ast: UBIMFamilyAST): CompiledGdlBundle {
  const p = ast.parameters;
  const qto = calculateFamilyQsTakeoff(ast);
  const matPrimary = MATERIAL_CATALOG[ast.materials.primary] ?? MATERIAL_CATALOG.oak_natural;
  const matSecondary = MATERIAL_CATALOG[ast.materials.secondary] ?? MATERIAL_CATALOG.alu_anodized;
  const matGlass = MATERIAL_CATALOG[ast.materials.glazing] ?? MATERIAL_CATALOG.glass_low_e;
  const matHardware = MATERIAL_CATALOG[ast.materials.hardware] ?? MATERIAL_CATALOG.stainless_brushed;

  const formulaLines = Object.values(p)
    .filter((param) => Boolean(param.formula))
    .map((param) => transpileRevitFormulaToGdl(param.id, param.formula!));

  const masterScript = [
    '! NEXUSBIM STUDIO — GDL MASTER SCRIPT',
    'EPS = 0.0001',
    'VALUES "A" RANGE [' + (p.A?.min ?? 0.3) + ', ' + (p.A?.max ?? 5.0) + ']',
    'VALUES "B" RANGE [' + (p.B?.min ?? 0.05) + ', ' + (p.B?.max ?? 2.0) + ']',
    'VALUES "ZZYZX" RANGE [' + (p.ZZYZX?.min ?? 0.4) + ', ' + (p.ZZYZX?.max ?? 6.0) + ']',
    'lodLevel = ' + ast.lod,
    ...formulaLines
  ].join('\n');

  const script3d = [
    '! NEXUSBIM STUDIO — 3D PARAMETRIC GDL SCRIPT (LOD ' + ast.lod + ')',
    'RESOL 36',
    'MATERIAL "' + matSecondary.gdlSurfaceName + '"',
    'BLOCK frameThk, B, ZZYZX',
    'ADDX A - frameThk',
    'BLOCK frameThk, B, ZZYZX',
    'DEL 1',
    'ADDZ ZZYZX - frameThk',
    'BLOCK A, B, frameThk',
    'DEL 1',
    'ADD frameThk, B / 2, 0',
    'ROTZ swingAngle',
    'MATERIAL "' + matPrimary.gdlSurfaceName + '"',
    'BLOCK A - (2 * frameThk), leafThk, ZZYZX - frameThk',
    'IF hasVisionPanel AND lodLevel >= 300 THEN',
    '    ADD (A - 2 * frameThk) * 0.55, -0.002, ZZYZX * 0.45',
    '    MATERIAL "' + matGlass.gdlSurfaceName + '"',
    '    BLOCK (A - 2 * frameThk) * 0.25, leafThk + 0.004, ZZYZX * 0.38',
    '    DEL 1',
    'ENDIF',
    'IF lodLevel >= 400 THEN',
    '    ADD A - (2 * frameThk) - 0.08, leafThk, 1.02',
    '    MATERIAL "' + matHardware.gdlSurfaceName + '"',
    '    CYLIND 0.06, 0.012',
    '    DEL 1',
    'ENDIF',
    'DEL 2',
    'END'
  ].join('\n');

  const script2d = [
    '! NEXUSBIM STUDIO — 2D PLAN SYMBOL SCRIPT (1:50)',
    'PEN 1',
    'RECT2 0, 0, frameThk, B',
    'RECT2 A - frameThk, 0, A, B',
    'ADD2 frameThk, B / 2',
    'ROT2 swingAngle',
    'RECT2 0, 0, A - 2 * frameThk, leafThk',
    'DEL 1',
    'ARC2 0, 0, A - 2 * frameThk, 0, swingAngle',
    'DEL 1',
    'END'
  ].join('\n');

  const propertiesScript5D = [
    '! NEXUSBIM STUDIO — 5D BIM GDL PROPERTIES & QUANTITY TAKEOFF SCRIPT (Script_PR)',
    'DESCRIPTOR "' + ast.csiMasterFormat + ' | OmniClass ' + ast.omniClassCode + '"',
    ...qto.lineItems.map((item) => 'COMPONENT "' + item.code + ' - ' + item.description + '", ' + item.grossQuantity + ', "' + item.unit + '"'),
    'COMPONENT "5D Total Installed CapEx (USD)", ' + qto.totalCapExUsd + ', "USD"',
    'COMPONENT "5D 30-Year Whole-Life Cost NPV (USD)", ' + qto.wholeLifeCost30YrUsd + ', "USD"',
    'COMPONENT "5D Embodied Carbon A1-A3 (kgCO2e)", ' + qto.totalEmbodiedCarbonKgCo2e + ', "kgCO2e"',
    'END'
  ].join('\n');

  const lpXmlSource = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Symbol IsArchivable="true" IsPlaceable="true" MainGUID="' + ast.guid + '" Version="28">',
    '  <Script_1D SectVersion="20" SectionFlags="0" SubIdent="0"><![CDATA[' + masterScript + ']]></Script_1D>',
    '  <Script_3D SectVersion="20" SectionFlags="0" SubIdent="0"><![CDATA[' + script3d + ']]></Script_3D>',
    '  <Script_2D SectVersion="20" SectionFlags="0" SubIdent="0"><![CDATA[' + script2d + ']]></Script_2D>',
    '  <Script_PR SectVersion="20" SectionFlags="0" SubIdent="0"><![CDATA[' + propertiesScript5D + ']]></Script_PR>',
    '</Symbol>'
  ].join('\n');

  return {
    masterScript,
    script3d,
    script2d,
    propertiesScript5D,
    parameterSummary: '',
    lpXmlSource,
    diagnostics: validateGdlTransformationStack(script3d)
  };
}