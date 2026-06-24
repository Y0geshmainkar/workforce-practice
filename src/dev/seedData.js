/**
 * Sample seed policies for development/testing.
 * Usage: import and call seedPolicies(agentId, clientId) from browser console.
 */
import { Timestamp } from 'firebase/firestore';
import { createPolicy } from '../services/firestore.service';

function ts(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return Timestamp.fromDate(d);
}

export const SAMPLE_POLICIES = [
  {
    policyNumber: 'LIC-2024-001234',
    title: 'Jeevan Anand Plan',
    type: 'Life',
    insurer: 'LIC of India',
    sumInsured: 2500000,
    premiumAmount: 28500,
    premiumFrequency: 'Annual',
    startDate: ts(-365),
    expiryDate: ts(25),       // expires in 25 days — Pending Renewal
    renewalDate: ts(-5),
    status: 'Pending Renewal',
    notes: 'Endowment policy with profit sharing.',
  },
  {
    policyNumber: 'HDFC-2024-005678',
    title: 'Click 2 Protect Life',
    type: 'Life',
    insurer: 'HDFC Life',
    sumInsured: 10000000,
    premiumAmount: 12400,
    premiumFrequency: 'Annual',
    startDate: ts(-180),
    expiryDate: ts(85),       // expires in 85 days — Active
    renewalDate: ts(55),
    status: 'Active',
    notes: 'Term insurance with critical illness rider.',
  },
  {
    policyNumber: 'STAR-2024-009012',
    title: 'Family Health Optima',
    type: 'Health',
    insurer: 'Star Health Insurance',
    sumInsured: 500000,
    premiumAmount: 18750,
    premiumFrequency: 'Annual',
    startDate: ts(-400),
    expiryDate: ts(15),       // expires in 15 days — Pending Renewal
    renewalDate: ts(-15),
    status: 'Pending Renewal',
    notes: 'Floater plan covering family of 4.',
  },
  {
    policyNumber: 'BAJAJ-2024-003456',
    title: 'Allianz Motor Comprehensive',
    type: 'Motor',
    insurer: 'Bajaj Allianz',
    sumInsured: 850000,
    premiumAmount: 9200,
    premiumFrequency: 'Annual',
    startDate: ts(-730),
    expiryDate: ts(-45),      // already expired — Lapsed
    renewalDate: ts(-75),
    status: 'Lapsed',
    notes: 'Third party + own damage. Vehicle: Honda City 2021.',
  },
  {
    policyNumber: 'HDFC-2024-007890',
    title: 'Home Suraksha Plus',
    type: 'Home',
    insurer: 'HDFC ERGO',
    sumInsured: 7500000,
    premiumAmount: 6800,
    premiumFrequency: 'Annual',
    startDate: ts(-60),
    expiryDate: ts(305),      // expires in ~10 months — Active
    renewalDate: ts(275),
    status: 'Active',
    notes: 'Structure + contents cover for 3BHK flat in Mumbai.',
  },
];

/**
 * Seed sample policies for a given agent and client.
 * @param {string} agentId
 * @param {string} agentEmail
 * @param {string} clientId
 * @param {string} clientName
 */
export async function seedPolicies(agentId, agentEmail, clientId, clientName) {
  for (const p of SAMPLE_POLICIES) {
    await createPolicy({ ...p, agentId, agentEmail, clientId, clientName });
    console.log(`Created: ${p.policyNumber}`);
  }
  console.log('Seeding complete.');
}
