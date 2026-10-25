const REVIT_TO_GDL_IDENTIFIERS: Record<string, string> = {
  Width: 'A',
  Depth: 'B',
  Height: 'ZZYZX',
  Frame_Thickness: 'frameThk',
  Leaf_Thickness: 'leafThk',
  Swing_Angle: 'swingAngle'
};

export function transpileRevitFormulaToGdl(targetParamId: string, rawFormula: string): string {
  let expr = rawFormula.trim();
  for (const [revitName, gdlId] of Object.entries(REVIT_TO_GDL_IDENTIFIERS)) {
    expr = expr.replace(new RegExp('\\b' + revitName + '\\b', 'g'), gdlId);
  }
  return targetParamId + ' = ' + expr;
}