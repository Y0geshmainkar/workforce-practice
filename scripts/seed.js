// Run once to seed Firestore with sample policies
// Usage: node scripts/seed.js YOUR_USER_UID
//
// Install dependency first: npm install firebase-admin
// Get service account: Firebase Console → Project Settings → Service accounts → Generate new private key
// Save as scripts/serviceAccount.json

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccount.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const uid = process.argv[2];
if (!uid) {
  console.error('Usage: node scripts/seed.js YOUR_USER_UID');
  process.exit(1);
}

const policies = [
  {
    title: 'IT Security Policy',
    description: 'Guidelines for secure system usage, password management, and device security.',
    category: 'IT',
    status: 'active',
    assignedTo: [uid],
    createdBy: uid,
    createdAt: Timestamp.now(),
  },
  {
    title: 'Remote Work Policy',
    description: 'Rules and expectations for employees working from home or remote locations.',
    category: 'HR',
    status: 'active',
    assignedTo: [uid],
    createdBy: uid,
    createdAt: Timestamp.now(),
  },
  {
    title: 'Data Privacy Policy',
    description: 'How the organization collects, stores, and protects personal data.',
    category: 'Legal',
    status: 'active',
    assignedTo: [uid],
    createdBy: uid,
    createdAt: Timestamp.now(),
  },
  {
    title: 'Expense Reimbursement Policy',
    description: 'Process for submitting and approving employee expense claims.',
    category: 'Finance',
    status: 'draft',
    assignedTo: [uid],
    createdBy: uid,
    createdAt: Timestamp.now(),
  },
];

for (const policy of policies) {
  const ref = await db.collection('policies').add(policy);
  console.log(`Created: ${policy.title} (${ref.id})`);
}

console.log('Seeding complete!');
process.exit(0);
