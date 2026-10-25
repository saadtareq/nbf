import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { createDefaultFamilyAST, type UBIMFamilyAST } from '@nexusbim/bim-schema';
import { compileFamilyToGdl } from '@nexusbim/gdl-compiler';
import { generateValueEngineeringReport } from '@nexusbim/qs-ve-engine';

const app = Fastify({ logger: true });
await app.register(cors, { origin: '*' });
await app.register(websocket);

const defaultDoor = createDefaultFamilyAST('door');
app.get('/api/families', async () => [defaultDoor]);
app.post<{ Body: UBIMFamilyAST }>('/api/families/compile', async (req) => ({
  compiled: compileFamilyToGdl(req.body),
  qsVeReport: generateValueEngineeringReport(req.body)
}));

const port = Number(process.env.PORT ?? 4000);
app.listen({ port, host: '0.0.0.0' }, () => console.log('API listening on ' + port));