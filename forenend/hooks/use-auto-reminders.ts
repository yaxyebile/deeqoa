'use client';

import { useEffect, useRef } from 'react';
import { checkAndSendReminders, cleanupOldReminders } from '@/lib/reminder-service';

// Check for reminders every 5 minutes
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

export function useAutoReminders() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initial check on mount
    const runCheck = async () => {
      // Cleanup old reminders first
      cleanupOldReminders();
      
      // Check and send reminders
      const result = await checkAndSendReminders();
      
      if (result.sent > 0) {
        console.log(`[AutoReminder] Sent ${result.sent} reminder(s)`);
      }
    };

    // Run initial check
    runCheck();

    // Set up interval for periodic checks
    intervalRef.current = setInterval(runCheck, CHECK_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
