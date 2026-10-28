import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { createApp } from '../server/src/app.js';
import { User } from '../server/src/models/User.js';
import { ServiceRequest } from '../server/src/models/ServiceRequest.js';

const screenshots = new URL('../docs/screenshots/', import.meta.url);
const evidence = new URL('../docs/evidence/', import.meta.url);
await mkdir(screenshots, { recursive: true });
await mkdir(evidence, { recursive: true });
const checks = [];
const captures = [];
const accessibility = [];
const pageErrors = [];
let mongo, server, browser;
const password = randomBytes(20).toString('hex');
const started = Date.now();

async function main() {
  mongo = await MongoMemoryServer.create({ binary: { version: '8.2.6' } });
  await mongoose.connect(mongo.getUri());
  const hash = await bcrypt.hash(password, 12);
  const student = await User.create({ name: 'Alex Morgan', email: 'alex@example.test', passwordHash: hash });
  await User.create({ name: 'Riley Chen', email: 'admin@example.test', passwordHash: hash, role: 'admin' });
  const samples = [
    ['Wi-Fi keeps disconnecting in the library', 'IT & Network', 'Central Library · First floor', 'Open', 'High'],
    ['Projector not working in seminar hall', 'Facilities', 'Academic Block · Seminar hall', 'In progress', 'Medium'],
    ['Drinking water station needs maintenance', 'Facilities', 'Main Block · Ground floor', 'Open', 'Medium'],
    ['Extend access to digital reference books', 'Library', 'Central Library · Digital section', 'Resolved', 'Low'],
    ['Room allocation clarification needed', 'Hostel', 'Student Residence · Block B', 'In progress', 'Medium'],
    ['Lab software license needs renewal', 'IT & Network', 'Computer Lab · Room 204', 'Resolved', 'High'],
    ['Request for updated lab schedule', 'Academic', 'Academic Office · Main Block', 'Closed', 'Low'],
    ['Broken desk in reading room', 'Library', 'Central Library · Reading room', 'Open', 'Low'],
    ['Hallway light flickering near lab', 'Facilities', 'Engineering Block · Floor 2', 'Resolved', 'Medium'],
    ['Campus transport information request', 'Other', 'Administration Office', 'Open', 'Low'],
    ['Network port not active in lab', 'IT & Network', 'Computer Lab · Room 202', 'In progress', 'Medium'],
    ['Hostel common area fan needs repair', 'Hostel', 'Student Residence · Common area', 'Resolved', 'Medium']
  ];
  const items = [];
  for (let i = 0; i < samples.length; i++) {
    const [title, category, location, status, priority] = samples[i];
    const createdAt = new Date(Date.now() - i * 86400000);
    items.push(await ServiceRequest.create({
      title, category, location, status, priority, owner: student._id, createdAt, updatedAt: createdAt,
      description: 'The Wi-Fi connection drops every few minutes while using the library study area. This has happened on multiple devices since yesterday. Please check the access point near the first-floor reading desks.',
      activity: [{ actor: student.name, type: 'created', message: 'Request submitted. We’ll keep you updated here.', at: createdAt }]
    }));
  }
  const config = { jwtSecret: randomBytes(48).toString('hex'), origin: 'http://127.0.0.1', production: false };
  const app = createApp(config);
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  config.origin = base;
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1040 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', error => pageErrors.push(error.message));
  page.setDefaultTimeout(15000);

  async function snapshot(file, caption, mobile = false) {
    const dismiss = page.getByRole('button', { name: 'Dismiss notification', exact: true });
    if (await dismiss.count()) await dismiss.click();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: fileURLToPath(new URL(file, screenshots)), fullPage: !mobile, animations: 'disabled' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert.equal(overflow, false, `Horizontal overflow on ${file}`);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    const blockers = result.violations.filter(v => ['serious', 'critical'].includes(v.impact));
    accessibility.push({ screen: file, violations: result.violations.map(v => ({ id: v.id, impact: v.impact, count: v.nodes.length })) });
    if (blockers.length) console.log('Accessibility needs attention:', file, JSON.stringify(blockers.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))));
    captures.push({ file, caption, width: page.viewportSize().width, mobile });
  }
  async function signIn(email) {
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.getByRole('heading', { name: /Hello,/ }).waitFor();
    await page.getByRole('heading', { name: 'Recent requests', exact: true }).waitFor();
  }

  await page.goto(`${base}/login`);
  await page.getByRole('heading', { name: 'Welcome back.' }).waitFor();
  await snapshot('01-sign-in.png', 'Sign-in screen with secure student and administrator access.');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByText('Enter a valid email address.').waitFor();
  checks.push('Sign-in inline validation rejects empty input.');
  await page.getByRole('link', { name: /Create an account/ }).click();
  await page.getByRole('heading', { name: 'Make yourself at home.' }).waitFor();
  await snapshot('02-registration.png', 'Student self-registration; administrators cannot register publicly.');
  await page.getByLabel('Full name').fill('Taylor Demo');
  await page.getByLabel('Email address').fill('taylor@example.test');
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await page.getByRole('heading', { name: 'Hello, Taylor.' }).waitFor();
  await page.getByText('You haven’t submitted a request yet.').waitFor();
  await snapshot('03-empty-dashboard.png', 'New account dashboard with a clear empty-state next step.');
  checks.push('Student registration creates a signed-in account with an empty scoped dashboard.');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await signIn('alex@example.test');
  await snapshot('04-student-dashboard.png', 'Student overview: request counts, recent requests, and category distribution.');
  checks.push('Sign-in loads persisted student requests and counts.');

  await page.getByRole('link', { name: 'My requests', exact: true }).first().click();
  await page.getByText('1–8 of 12 requests').waitFor();
  await snapshot('05-request-list.png', 'Searchable request list with filters, priorities, statuses, and pagination.');
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await page.getByText('9–12 of 12 requests').waitFor();
  await page.getByRole('button', { name: 'Previous page', exact: true }).click();
  await page.getByText('1–8 of 12 requests').waitFor();
  checks.push('Pagination loads the next and previous result pages.');
  await page.getByLabel('Filter by status').selectOption('Resolved');
  await page.getByText('1–4 of 4 requests').waitFor();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByText('1–8 of 12 requests').waitFor();
  await page.getByLabel('Search requests', { exact: true }).fill('no-such-request');
  await page.getByLabel('Filter by status').selectOption('Open');
  await page.getByText('1–4 of 4 requests').waitFor();
  assert.equal(await page.getByLabel('Search requests', { exact: true }).inputValue(), 'no-such-request');
  await page.getByRole('button', { name: 'Run search' }).click();
  await page.getByRole('heading', { name: 'No requests found' }).waitFor();
  checks.push('Status filtering and no-match search produce correct result/empty states.');
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.route('**/api/requests?*', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'The service is temporarily unavailable. Please try again.' }) }));
  await page.reload();
  await page.getByRole('heading', { name: 'Let’s try that again' }).waitFor();
  await snapshot('06-retry-state.png', 'Simulated API outage demonstrates an explicit error state and retry action.');
  await page.unroute('**/api/requests?*');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await page.getByText('1–8 of 12 requests').waitFor();
  checks.push('A simulated API outage shows retry; retry restores real database results.');

  await page.getByRole('link', { name: 'New request', exact: true }).last().click();
  await page.getByRole('heading', { name: 'What needs a little attention?' }).waitFor();
  await snapshot('07-new-request.png', 'New request form with category, location, description, and urgency.');
  await page.getByRole('button', { name: 'Submit request', exact: true }).click();
  await page.getByText('Add a clear title of at least 5 characters.').waitFor();
  await page.getByLabel('Give your request a title').fill('Test reading room light needs repair');
  await page.getByLabel('Category', { exact: true }).selectOption('Facilities');
  await page.getByLabel('Location', { exact: true }).fill('Library second floor');
  await page.getByLabel('Tell us a little more').fill('The reading lamp near desk 12 does not turn on. Please check the fixture.');
  await page.getByRole('button', { name: 'Submit request', exact: true }).click();
  await page.getByRole('heading', { name: 'Test reading room light needs repair', exact: true }).waitFor();
  const newId = page.url().split('/').at(-1);
  assert.ok(await ServiceRequest.findById(newId));
  checks.push('Create validates inputs, saves to MongoDB, and opens the new request.');
  await page.getByLabel('Keep the conversation going').fill('The lamp is at the desk beside the north window.');
  await page.getByRole('button', { name: 'Add update', exact: true }).click();
  await page.getByText('The lamp is at the desk beside the north window.', { exact: true }).waitFor();
  await page.getByRole('link', { name: 'Edit request', exact: true }).click();
  await page.getByLabel('Location', { exact: true }).fill('Library second floor, north window');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await page.getByRole('heading', { name: 'Test reading room light needs repair', exact: true }).waitFor();
  assert.equal((await ServiceRequest.findById(newId)).location, 'Library second floor, north window');
  checks.push('Comment and edit update the request and preserve activity history.');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete request', exact: true }).click();
  await page.getByRole('heading', { name: 'My requests', exact: true }).waitFor();
  assert.equal(await ServiceRequest.findById(newId), null);
  checks.push('Confirmed deletion removes an open request from MongoDB.');

  await page.goto(`${base}/requests/${items[0]._id}`);
  await page.getByRole('heading', { name: samples[0][0], exact: true }).waitFor();
  await snapshot('08-request-detail.png', 'Request detail showing progress stages, metadata, and activity conversation.');
  await page.reload();
  await page.getByRole('heading', { name: samples[0][0], exact: true }).waitFor();
  checks.push('Refreshing a deep link returns the application and persisted request.');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await signIn('admin@example.test');
  await snapshot('09-admin-dashboard.png', 'Administrator overview with campus-wide visibility.');
  await page.goto(`${base}/requests/${items[0]._id}`);
  await page.getByRole('heading', { name: 'Resolution desk', exact: true }).waitFor();
  await page.getByLabel('Status', { exact: true }).selectOption('In progress');
  await page.getByRole('button', { name: 'Save progress', exact: true }).click();
  await page.getByText(/Status: Open → In progress/).waitFor();
  await page.getByLabel('Keep the conversation going').fill('The IT team is checking the first-floor access point. We will share another update after testing.');
  await page.getByRole('button', { name: 'Add update', exact: true }).click();
  await page.getByText('The IT team is checking the first-floor access point. We will share another update after testing.', { exact: true }).waitFor();
  await snapshot('10-admin-resolution.png', 'Administrator resolution controls and a recorded status/comment update.');
  assert.equal((await ServiceRequest.findById(items[0]._id)).status, 'In progress');
  checks.push('Administrator changes status and posts an update through the browser.');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await signIn('alex@example.test');
  await page.goto(`${base}/requests/${items[0]._id}`);
  await page.getByText('The IT team is checking the first-floor access point. We will share another update after testing.', { exact: true }).waitFor();
  assert.equal(await page.getByRole('link', { name: 'Edit request', exact: true }).count(), 0);
  checks.push('Student sees administrator updates and cannot edit a non-open request.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.getByRole('heading', { name: 'Recent requests', exact: true }).waitFor();
  await snapshot('11-mobile-dashboard.png', '390px mobile dashboard with stacked cards and compact navigation.', true);
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'My requests', exact: true }).click();
  await page.getByText('1–8 of 12 requests').waitFor();
  await snapshot('12-mobile-requests.png', 'Mobile request list switches from a table to readable request cards.', true);
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'New request', exact: true }).click();
  await page.getByRole('heading', { name: 'What needs a little attention?' }).waitFor();
  await snapshot('13-mobile-form.png', 'Mobile request form with stacked labelled inputs.', true);
  checks.push('Dashboard, list, and form work at 390px without horizontal overflow.');
  assert.deepEqual(pageErrors, [], 'Uncaught browser errors');
  checks.push('No uncaught JavaScript errors during the complete browser journey.');
  const serious = accessibility.flatMap(item => item.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => `${item.screen}: ${v.id}`));
  assert.deepEqual(serious, [], 'Serious/critical axe accessibility violations');
  checks.push('Major desktop/mobile screens pass automated serious/critical WCAG A/AA checks.');
  await context.close();
}
try {
  await main();
  const result = { runAt: new Date().toISOString(), durationSeconds: Math.round((Date.now() - started) / 1000), environment: 'Local Chromium with production Vite build, Express, isolated MongoDB 8.2.6, synthetic users', passed: checks.length, checks, screenshots: captures, accessibility, pageErrors, liveDeploymentTested: false };
  await writeFile(new URL('browser-results.json', evidence), JSON.stringify(result, null, 2));
  console.log(`Passed ${checks.length} browser scenarios; captured ${captures.length} screens.`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}
