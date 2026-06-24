import { getPoliciesByStatus, changeStatus, createReminder, getRemindersForAgent } from './firestore.service';

/**
 * Check active policies and flag those expiring within 30 days.
 * Creates reminders for 1-day, 7-day, and 30-day thresholds (no duplicates).
 * TODO: Move to Firebase Cloud Function — scheduled daily trigger.
 * @param {string} agentId
 * @param {string} agentEmail
 * @returns {Promise<void>}
 */
export async function checkAndFlagExpiringPolicies(agentId, agentEmail) {
  const activePolicies = await getPoliciesByStatus(agentId, 'Active');
  const today = new Date();

  for (const policy of activePolicies) {
    const expiryDate = policy.expiryDate.toDate();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 30) {
      await changeStatus(policy.id, 'Pending Renewal', agentId, agentEmail,
        'Auto-flagged: expiry within 30 days');
    }

    let reminderType = null;
    if (daysUntilExpiry <= 1) reminderType = '1-day-expiry';
    else if (daysUntilExpiry <= 7) reminderType = '7-day-expiry';
    else if (daysUntilExpiry <= 30) reminderType = '30-day-expiry';

    if (reminderType) {
      const existing = await getRemindersForAgent(agentId);
      const alreadyExists = existing.some(
        (r) => r.policyId === policy.id && r.type === reminderType
      );
      if (!alreadyExists) {
        await createReminder({
          policyId: policy.id,
          policyNumber: policy.policyNumber,
          clientId: policy.clientId,
          clientEmail: policy.clientEmail,
          clientName: policy.clientName,
          agentId,
          type: reminderType,
          message: `Policy ${policy.policyNumber} (${policy.clientName}) expires in ${daysUntilExpiry} day(s).`,
          read: false,
        });
      }
    }
  }
}
