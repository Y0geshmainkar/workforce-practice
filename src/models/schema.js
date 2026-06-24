/**
 * @fileoverview Firestore document shape definitions for PolicyHub.
 * This file is documentation only — no runtime code.
 * Collections are created automatically on first write.
 */

/**
 * policies/{policyId}
 *
 * @typedef {Object} Policy
 * @property {string} id                  - Firestore document ID
 * @property {string} policyNumber        - Unique identifier e.g. "POL-2024-00123"
 * @property {string} title               - e.g. "Term Life - 50L"
 * @property {'Life'|'Health'|'Motor'|'Home'|'Travel'|'Other'} type
 * @property {string} insurer             - e.g. "LIC", "HDFC Life", "Star Health"
 * @property {number} sumInsured          - Coverage amount in INR
 * @property {number} premiumAmount       - Annual premium in INR
 * @property {'Annual'|'Semi-Annual'|'Quarterly'|'Monthly'} premiumFrequency
 * @property {import('firebase/firestore').Timestamp} startDate
 * @property {import('firebase/firestore').Timestamp} expiryDate   - Drives all renewal alerts
 * @property {import('firebase/firestore').Timestamp} renewalDate  - Usually 30 days before expiryDate
 * @property {'Active'|'Pending Renewal'|'Lapsed'|'Cancelled'|'Expired'} status
 * @property {string} clientId            - UID of the policyholder (USER role)
 * @property {string} clientName          - Denormalized for fast display
 * @property {string} clientEmail         - Denormalized
 * @property {string} agentId             - UID of the agent (ADMIN role) who owns this policy
 * @property {string} notes               - Agent notes
 * @property {string[]} documents         - Placeholder for future file upload links
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} updatedAt
 * @property {import('firebase/firestore').Timestamp} lastStatusChange
 * @property {string} lastStatusChangedBy - UID of user who last changed the status
 */

/**
 * policies/{policyId}/statusHistory/{entryId}
 *
 * @typedef {Object} StatusHistoryEntry
 * @property {string} fromStatus
 * @property {string} toStatus
 * @property {string} changedBy           - UID
 * @property {string} changedByEmail
 * @property {import('firebase/firestore').Timestamp} changedAt
 * @property {string} note                - Required reason for status change
 */

/**
 * reminders/{reminderId}
 *
 * @typedef {Object} Reminder
 * @property {string} policyId
 * @property {string} policyNumber
 * @property {string} clientId
 * @property {string} clientEmail
 * @property {string} clientName
 * @property {string} agentId
 * @property {'30-day-expiry'|'7-day-expiry'|'1-day-expiry'|'manual'} type
 * @property {string} message
 * @property {boolean} read
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

/**
 * clients/{clientId}
 * Mirrors the users collection but with insurance-specific fields.
 *
 * @typedef {Object} Client
 * @property {string} uid
 * @property {string} email
 * @property {string} displayName
 * @property {string} phone
 * @property {string} dateOfBirth         - ISO date string e.g. "1990-05-15"
 * @property {string} address
 * @property {string} agentId             - Which agent manages this client
 * @property {import('firebase/firestore').Timestamp} createdAt
 */
