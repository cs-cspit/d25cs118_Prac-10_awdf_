// Seeds a demo user with many tasks so the cost of a MongoDB read (and so the
// benefit of caching) is visible. Usage:  npm run seed            (2000 tasks)
//                                         npm run seed -- 5000    (custom count)
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Task from '../models/Task.js';

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'password123';
const count = Number(process.argv[2]) || 2000;
const priorities = ['low', 'medium', 'high'];

await connectDB();

let user = await User.findOne({ email: DEMO_EMAIL });
if (!user) {
  user = await User.create({
    name: 'Demo User',
    email: DEMO_EMAIL,
    password: await bcrypt.hash(DEMO_PASSWORD, 10)
  });
}

await Task.deleteMany({ user: user._id });

const now = Date.now();
const tasks = Array.from({ length: count }, (_, i) => ({
  title: `Sample task #${i + 1}`,
  description: `Seeded task ${i + 1} used to measure caching. `.repeat(3).trim(),
  priority: priorities[i % 3],
  completed: i % 4 === 0,
  user: user._id,
  createdAt: new Date(now - i * 60_000)
}));

await Task.insertMany(tasks);
console.log(`Seeded ${count} tasks for ${DEMO_EMAIL} (password: ${DEMO_PASSWORD})`);

await mongoose.disconnect();
