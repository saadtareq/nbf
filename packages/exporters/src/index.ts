import type { UBIMFamilyAST } from '@nexusbim/bim-schema';
import { compileFamilyToGdl } from '@nexusbim/gdl-compiler';
import { calculateFamilyQsTakeoff, generateValueEngineeringReport } from '@nexusbim/qs-ve-engine';

export interface ExporterPlugin {
  readonly id: string;
  readonly extension: string;
  readonly mimeType: string;
  readonly label: string;
  exportText(ast: UBIMFamilyAST): string;
}

export const Ifc4StepExporter: ExporterPlugin = {
  id: 'ifc4',
  extension: '.ifc',
  mimeType: 'application/x-step',
  label: '5D IFC 4.3 STEP Physical File (.IFC)',
  exportText(ast: UBIMFamilyAST): string {
    const qto = calculateFamilyQsTakeoff(ast);
    return [
      'ISO-10303-21;',
      'HEADER;',
      "FILE_SCHEMA(('IFC4'));",
      'ENDSEC;',
      'DATA;',
      "#100=IFCDOOR('" + ast.guid.slice(0, 22) + "',$,'" + ast.name + "','OmniClass " + ast.omniClassCode + "');",
      "#210=IFCCOSTVALUE('InstalledCapEx','USD',IFCMONETARYMEASURE(" + qto.totalCapExUsd.toFixed(2) + "));",
      'ENDSEC;',
      'END-ISO-10303-21;'
    ].join('\n');
  }
};

export const QsBoqCsvExporter: ExporterPlugin = {
  id: 'qs-boq-csv',
  extension: '-5D-BoQ-and-VE.csv',
  mimeType: 'text/csv',
  label: '5D QS Bill of Quantities & VE Matrix (.CSV)',
  exportText(ast: UBIMFamilyAST): string {
    const report = generateValueEngineeringReport(ast);
    const qto = report.baseline;
    const rows = [
      'Item Code,Description,Unit,Net Qty,Waste %,Gross Qty,Total Unit Rate (USD),Total Cost (USD),Mass (kg),Embodied Carbon (kgCO2e)',
      ...qto.lineItems.map(i => [i.code, '"' + i.description + '"', i.unit, i.netQuantity, i.wastePercent, i.grossQuantity, i.unitRateTotalUsd, i.totalCostUsd, i.massKg, i.embodiedCarbonKgCo2e].join(',')),
      'TOTAL CAPEX,,,,,,,' + qto.totalCapExUsd + ',' + qto.totalMassKg + ',' + qto.totalEmbodiedCarbonKgCo2e
    ];
    return rows.join('\n');
  }
};

export const RevitTypeCatalogExporter: ExporterPlugin = {
  id: 'revit-txt',
  extension: '.txt',
  mimeType: 'text/plain',
  label: 'Revit Type Catalog (.TXT)',
  exportText(ast: UBIMFamilyAST): string {
    const header = ',Width##LENGTH##MILLIMETERS,Depth##LENGTH##MILLIMETERS,Height##LENGTH##MILLIMETERS';
    const rows = ast.typePresets.map(p => p.name + ',' + Math.round(Number(p.values.A ?? 0.9) * 1000) + ',' + Math.round(Number(p.values.B ?? 0.15) * 1000) + ',' + Math.round(Number(p.values.ZZYZX ?? 2.1) * 1000));
    return [header, ...rows].join('\n');
  }
};

export const LpXmlExporter: ExporterPlugin = {
  id: 'lpxml',
  extension: '.xml',
  mimeType: 'application/xml',
  label: 'Graphisoft LP_XMLConverter (.XML)',
  exportText(ast: UBIMFamilyAST): string {
    return compileFamilyToGdl(ast).lpXmlSource;
  }
};

export const EXPORTER_REGISTRY: Record<string, ExporterPlugin> = {
  lpxml: LpXmlExporter,
  ifc4: Ifc4StepExporter,
  'qs-boq-csv': QsBoqCsvExporter,
  'revit-txt': RevitTypeCatalogExporter
};