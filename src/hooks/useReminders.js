import { useEffect, useState, useCallback } from 'react';
import {
  getRemindersForAgent, getRemindersForClient,
  markReminderRead, markAllRemindersRead, getUnreadReminderCount,
} from '../services/firestore.service';

export function useReminders(uid, role) {
  const [reminders, setReminders] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReminders = useCallback(async () => {
    if (!uid) return;
    try {
      const data = role === 'ADMIN'
        ? await getRemindersForAgent(uid)
        : await getRemindersForClient(uid);
      setReminders(data);
      if (role === 'ADMIN') {
        const count = await getUnreadReminderCount(uid);
        setUnreadCount(count);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [uid, role]);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  const markRead = useCallback(async (reminderId) => {
    await markReminderRead(reminderId);
    fetchReminders();
  }, [fetchReminders]);

  const markAllRead = useCallback(async () => {
    await markAllRemindersRead(uid);
    fetchReminders();
  }, [uid, fetchReminders]);

  return { reminders, unreadCount, markRead, markAllRead, loading, error };
}
