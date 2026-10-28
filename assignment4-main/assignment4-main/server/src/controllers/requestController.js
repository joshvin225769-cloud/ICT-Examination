import { ServiceRequest } from '../models/ServiceRequest.js';
import { HttpError } from '../middleware/errors.js';

const scope = user => user.role === 'admin' ? {} : { owner: user._id };
const event = (user, type, message) => ({ actor: user.name, type, message, at: new Date() });
async function findAccessible(req) {
  const item = await ServiceRequest.findOne({ _id: req.params.id, ...scope(req.user) });
  if (!item) throw new HttpError(404, 'Request not found.');
  return item;
}
function canAppend(item) {
  if (item.activity.length >= 200) throw new HttpError(409, 'This request has reached its activity limit. Contact the administrator.');
}
function requireOwnerOpen(item, user) {
  if (String(item.owner) !== String(user._id)) throw new HttpError(403, 'Only the reporting student can change the original request.');
  if (item.status !== 'Open') throw new HttpError(409, 'Only open requests can be edited or deleted.');
}
const populateOwner = item => item.populate('owner', 'name email');

export async function list(req, res) {
  const { page, limit, search, status, category } = req.filters;
  const filter = { ...scope(req.user) };
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = ['title', 'reference', 'location'].map(field => ({ [field]: { $regex: escaped, $options: 'i' } }));
  }
  const [data, total] = await Promise.all([
    ServiceRequest.find(filter).select('-activity').populate('owner', 'name').sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ServiceRequest.countDocuments(filter)
  ]);
  res.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}
export async function stats(req, res) {
  const match = scope(req.user);
  const [statusRows, categoryRows] = await Promise.all([
    ServiceRequest.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    ServiceRequest.aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
  ]);
  const counts = Object.fromEntries(statusRows.map(row => [row._id, row.count]));
  res.json({ data: { total: statusRows.reduce((sum, row) => sum + row.count, 0), counts, categories: categoryRows.map(row => ({ category: row._id, count: row.count })) } });
}
export async function create(req, res) {
  const item = await ServiceRequest.create({ ...req.input, owner: req.user._id, activity: [event(req.user, 'created', 'Request submitted. We’ll keep you updated here.')] });
  res.status(201).json({ data: await populateOwner(item) });
}
export async function detail(req, res) {
  res.json({ data: await populateOwner(await findAccessible(req)) });
}
export async function update(req, res) {
  const item = await findAccessible(req);
  requireOwnerOpen(item, req.user);
  canAppend(item);
  Object.assign(item, req.input);
  item.activity.push(event(req.user, 'updated', 'Updated the request details.'));
  await item.save();
  res.json({ data: await populateOwner(item) });
}
export async function updateStatus(req, res) {
  const item = await findAccessible(req);
  canAppend(item);
  const previous = item.status;
  const oldPriority = item.priority;
  item.status = req.input.status;
  item.priority = req.input.priority;
  if (previous === item.status && oldPriority === item.priority) return res.json({ data: await populateOwner(item) });
  item.activity.push(event(req.user, 'status', `Status: ${previous} → ${item.status}. Priority: ${oldPriority} → ${item.priority}.`));
  await item.save();
  res.json({ data: await populateOwner(item) });
}
export async function comment(req, res) {
  const item = await findAccessible(req);
  canAppend(item);
  item.activity.push(event(req.user, 'comment', req.input.message));
  await item.save();
  res.status(201).json({ data: await populateOwner(item) });
}
export async function remove(req, res) {
  const item = await findAccessible(req);
  requireOwnerOpen(item, req.user);
  // Include version/status in the delete so concurrent status changes cannot be lost.
  const result = await ServiceRequest.deleteOne({ _id: item._id, owner: req.user._id, status: 'Open', __v: item.__v });
  if (!result.deletedCount) throw new HttpError(409, 'This request changed. Refresh and try again.');
  res.json({ message: 'Request deleted.' });
}
