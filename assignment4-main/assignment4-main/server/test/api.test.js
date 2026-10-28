import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { ServiceRequest } from '../src/models/ServiceRequest.js';

let mongo, app;
const passed = [];
const config = { jwtSecret: randomBytes(48).toString('hex'), origin: 'http://localhost:5173', production: false };
const password = randomBytes(20).toString('hex');
const report = { title: 'Library Wi-Fi keeps disconnecting', description: 'The network disconnects every few minutes on the first floor.', location: 'Central Library, floor 1', category: 'IT & Network', priority: 'High' };
const check = (name, fn) => test(name, async () => { await fn(); passed.push(name); });

before(async () => {
  mongo = await MongoMemoryServer.create({ binary: { version: '8.2.6' } });
  await mongoose.connect(mongo.getUri());
  await Promise.all([User.init(), ServiceRequest.init()]);
  app = createApp(config);
});
beforeEach(async () => {
  await Promise.all([User.deleteMany({}), ServiceRequest.deleteMany({})]);
  app = createApp(config);
});
after(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
  const dir = new URL('../../docs/evidence/', import.meta.url);
  await mkdir(dir, { recursive: true });
  await writeFile(new URL('api-results.json', dir), JSON.stringify({ runAt: new Date().toISOString(), environment: 'Local isolated MongoDB 8.2.6; Express HTTP integration', passed: passed.length, checks: passed }, null, 2));
});
async function student(email = 'student@example.test') {
  const agent = request.agent(app);
  const result = await agent.post('/api/auth/register').send({ name: 'Demo Student', email, password }).expect(201);
  return { agent, user: result.body.data, response: result };
}
async function administrator() {
  await User.create({ name: 'Demo Administrator', email: 'admin@example.test', passwordHash: await bcrypt.hash(password, 12), role: 'admin' });
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email: 'admin@example.test', password }).expect(200);
  return agent;
}
async function created(agent) { return (await agent.post('/api/requests').send(report).expect(201)).body.data; }

check('Registration creates student, hashes password, and issues HttpOnly SameSite cookie', async () => {
  const { agent, response } = await student();
  assert.equal(response.body.data.role, 'student');
  assert.equal(response.body.data.passwordHash, undefined);
  const stored = await User.findOne().select('+passwordHash');
  assert.notEqual(stored.passwordHash, password);
  assert.ok(await bcrypt.compare(password, stored.passwordHash));
  assert.match(response.headers['set-cookie'][0], /HttpOnly/);
  assert.match(response.headers['set-cookie'][0], /SameSite=Lax/);
  await agent.get('/api/auth/me').expect(200);
});
check('Registration rejects invalid input, duplicate email, and public admin escalation', async () => {
  await request(app).post('/api/auth/register').send({ name: 'A', email: 'bad', password: 'short' }).expect(400);
  await student();
  await request(app).post('/api/auth/register').send({ name: 'Other Student', email: 'STUDENT@example.test', password }).expect(409);
  await request(app).post('/api/auth/register').send({ name: 'Other Student', email: 'other@example.test', password, role: 'admin' }).expect(400);
});
check('Login rejects bad credentials and logout invalidates browser session', async () => {
  const { agent } = await student();
  await agent.post('/api/auth/logout').expect(200);
  await agent.get('/api/auth/me').expect(401);
  await agent.post('/api/auth/login').send({ email: 'student@example.test', password: 'incorrect' }).expect(401);
  await agent.post('/api/auth/login').send({ email: 'student@example.test', password: 'x'.repeat(73) }).expect(400);
  await agent.post('/api/auth/login').send({ email: 'student@example.test', password }).expect(200);
  await agent.get('/api/auth/me').expect(200);
});
check('Protected endpoints reject missing and malformed sessions', async () => {
  await request(app).get('/api/requests').expect(401);
  await request(app).post('/api/requests').send(report).expect(401);
  await request(app).get('/api/requests/stats').set('Cookie', 'campusdesk_session=invalid').expect(401);
});
check('Create, read, edit, comment, and delete persist through MongoDB', async () => {
  const { agent } = await student();
  const item = await created(agent);
  assert.match(item.reference, /^CD-/);
  assert.equal(item.activity.length, 1);
  await agent.get(`/api/requests/${item._id}`).expect(200);
  const updated = await agent.patch(`/api/requests/${item._id}`).send({ ...report, location: 'Library second floor' }).expect(200);
  assert.equal(updated.body.data.location, 'Library second floor');
  const commented = await agent.post(`/api/requests/${item._id}/comments`).send({ message: 'The problem continues after restarting.' }).expect(201);
  assert.equal(commented.body.data.activity.length, 3);
  assert.equal((await ServiceRequest.findById(item._id)).location, 'Library second floor');
  await agent.delete(`/api/requests/${item._id}`).expect(200);
  assert.equal(await ServiceRequest.countDocuments(), 0);
});
check('Student ownership is enforced for lists, details, edits, comments, deletes, and stats', async () => {
  const one = await student();
  const item = await created(one.agent);
  const two = await student('another@example.test');
  const list = await two.agent.get('/api/requests').expect(200);
  assert.equal(list.body.data.length, 0);
  assert.equal((await two.agent.get('/api/requests/stats')).body.data.total, 0);
  await two.agent.get(`/api/requests/${item._id}`).expect(404);
  await two.agent.patch(`/api/requests/${item._id}`).send(report).expect(404);
  await two.agent.delete(`/api/requests/${item._id}`).expect(404);
  await two.agent.post(`/api/requests/${item._id}/comments`).send({ message: 'Not mine' }).expect(404);
});
check('Only administrators can update resolution; changes appear in activity history', async () => {
  const { agent } = await student();
  const item = await created(agent);
  await agent.patch(`/api/requests/${item._id}/status`).send({ status: 'Resolved', priority: 'Low' }).expect(403);
  const admin = await administrator();
  const result = await admin.patch(`/api/requests/${item._id}/status`).send({ status: 'In progress', priority: 'High' }).expect(200);
  assert.equal(result.body.data.status, 'In progress');
  assert.equal(result.body.data.activity[1].type, 'status');
  assert.equal((await admin.get('/api/requests')).body.pagination.total, 1);
  assert.equal((await admin.get('/api/requests/stats')).body.data.total, 1);
});
check('Non-open requests cannot be edited or deleted; admin cannot rewrite original report', async () => {
  const { agent } = await student();
  const item = await created(agent);
  const admin = await administrator();
  await admin.patch(`/api/requests/${item._id}`).send(report).expect(403);
  await admin.delete(`/api/requests/${item._id}`).expect(403);
  await admin.patch(`/api/requests/${item._id}/status`).send({ status: 'Resolved', priority: 'Medium' }).expect(200);
  await agent.patch(`/api/requests/${item._id}`).send(report).expect(409);
  await agent.delete(`/api/requests/${item._id}`).expect(409);
});
check('Search, combined filters, and pagination return bounded consistent results', async () => {
  const { agent } = await student();
  await created(agent);
  await agent.post('/api/requests').send({ ...report, title: 'Broken classroom light', category: 'Facilities' }).expect(201);
  const page = await agent.get('/api/requests?page=2&limit=1').expect(200);
  assert.equal(page.body.data.length, 1);
  assert.equal(page.body.pagination.pages, 2);
  const search = await agent.get('/api/requests?search=library&category=IT%20%26%20Network&status=Open').expect(200);
  assert.equal(search.body.data.length, 1);
  const special = await agent.get('/api/requests?search=%5B.*').expect(200);
  assert.equal(special.body.data.length, 0);
});
check('Validation rejects malformed IDs, query operators, invalid enums, and oversized pages', async () => {
  const { agent } = await student();
  await agent.get('/api/requests/not-an-id').expect(400);
  await agent.get('/api/requests?limit=51').expect(400);
  await agent.get('/api/requests?page=-1').expect(400);
  await agent.get('/api/requests?search[$ne]=x').expect(400);
  await agent.post('/api/requests').send({ ...report, category: 'Invalid' }).expect(400);
  await agent.post('/api/requests').send({ ...report, owner: new mongoose.Types.ObjectId() }).expect(400);
  await agent.post('/api/requests').send({ ...report, title: { $ne: '' } }).expect(400);
  await agent.post('/api/requests').send({ ...report, status: 'Resolved' }).expect(400);
});
check('Missing resources return 404 and empty comments return 400', async () => {
  const { agent } = await student();
  await agent.get(`/api/requests/${new mongoose.Types.ObjectId()}`).expect(404);
  const item = await created(agent);
  await agent.post(`/api/requests/${item._id}/comments`).send({ message: ' ' }).expect(400);
});
check('Origin protection blocks cross-site mutations but accepts the configured UI origin', async () => {
  await request(app).post('/api/auth/logout').set('Origin', 'https://untrusted.example').expect(403);
  await request(app).post('/api/auth/logout').set('Origin', config.origin).expect(200);
});
check('Errors are safe JSON, health checks database readiness, and responses are not cached', async () => {
  await request(app).get('/api/health').expect(200);
  const response = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{').expect(400);
  assert.equal(typeof response.body.message, 'string');
  assert.equal(response.body.stack, undefined);
  const result = await request(app).get('/api/unknown').expect(404);
  assert.equal(result.headers['cache-control'], 'no-store');
});
check('Sensitive authentication endpoints are rate limited', async () => {
  let limited = false;
  for (let i = 0; i < 31; i++) {
    const result = await request(app).post('/api/auth/login').send({});
    if (result.status === 429) { limited = true; assert.equal(typeof result.body.message, 'string'); break; }
  }
  assert.ok(limited);
});
check('Production cookies are Secure and the frontend receives security headers', async () => {
  const productionApp = createApp({ ...config, production: true, origin: 'https://campus.example.test' });
  const result = await request(productionApp).post('/api/auth/register').send({ name: 'Production Demo', email: 'production@example.test', password }).expect(201);
  assert.match(result.headers['set-cookie'][0], /; Secure/);
  assert.ok(result.headers['content-security-policy']);
  assert.ok(result.headers['strict-transport-security']);
  assert.equal(result.headers['x-powered-by'], undefined);
});
check('Activity growth is bounded with a recoverable conflict response', async () => {
  const { agent } = await student();
  const item = await created(agent);
  await ServiceRequest.updateOne({ _id: item._id }, { $set: { activity: Array.from({ length: 200 }, () => ({ actor: 'Synthetic Demo', type: 'comment', message: 'Existing activity', at: new Date() })) } });
  const result = await agent.post(`/api/requests/${item._id}/comments`).send({ message: 'One more update' }).expect(409);
  assert.match(result.body.message, /activity limit/);
  assert.equal((await ServiceRequest.findById(item._id)).activity.length, 200);
});
