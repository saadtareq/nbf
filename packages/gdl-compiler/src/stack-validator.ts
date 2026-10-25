export interface StackDiagnostic {
  isBalanced: boolean;
  totalPushes: number;
  totalPops: number;
  unclosedDepth: number;
  errors: Array<{ line: number; message: string }>;
}

export function validateGdlTransformationStack(script3d: string): StackDiagnostic {
  const lines = script3d.split('\n');
  let depth = 0;
  let totalPushes = 0;
  let totalPops = 0;
  const errors: Array<{ line: number; message: string }> = [];
  const pushRegex = /^\s*(ADD|ADDX|ADDY|ADDZ|ROT|ROTX|ROTY|ROTZ|MUL|MULX|MULY|MULZ)\b/i;
  const delRegex = /^\s*DEL\s+(TOP|\d+)/i;

  lines.forEach((rawLine, idx) => {
    const line = rawLine.replace(/!.*$/, '').trim();
    if (!line) return;
    if (pushRegex.test(line)) {
      depth += 1;
      totalPushes += 1;
    } else {
      const match = delRegex.exec(line);
      if (match) {
        const count = match[1].toUpperCase() === 'TOP' ? depth : parseInt(match[1], 10);
        depth -= count;
        totalPops += count;
        if (depth < 0) {
          errors.push({ line: idx + 1, message: 'Stack underflow on DEL ' + count });
          depth = 0;
        }
      }
    }
  });
  return { isBalanced: errors.length === 0 && depth === 0, totalPushes, totalPops, unclosedDepth: depth, errors };
}