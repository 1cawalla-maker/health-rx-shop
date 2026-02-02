// Call Attempt Service - abstraction layer for call attempt logging
// Designed to swap from localStorage mock → Supabase with minimal changes

import type { MockCallAttempt } from '@/types/telehealth';

// Types that mirror Supabase call_attempts table structure
export interface CallAttemptRecord {
  id: string;
  bookingId: string;
  doctorId: string;
  attemptNumber: number;
  attemptedAt: string;
  answered: boolean;
  notes: string | null;
}

export interface LogCallAttemptParams {
  bookingId: string;
  doctorId: string;
  answered: boolean;
  notes?: string;
}

export interface CallAttemptService {
  getAttempts(bookingId: string): Promise<CallAttemptRecord[]>;
  logAttempt(params: LogCallAttemptParams): Promise<CallAttemptRecord>;
  canMarkNoShow(attempts: CallAttemptRecord[]): boolean;
}

// localStorage key for mock call attempts
const MOCK_CALL_ATTEMPTS_KEY = 'nicopatch_mock_call_attempts';

// Helper to get stored attempts
function getStoredAttempts(): CallAttemptRecord[] {
  const stored = localStorage.getItem(MOCK_CALL_ATTEMPTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Helper to save attempts
function saveAttempts(attempts: CallAttemptRecord[]): void {
  localStorage.setItem(MOCK_CALL_ATTEMPTS_KEY, JSON.stringify(attempts));
}

// Mock implementation (localStorage-based)
// When ready to switch to Supabase, replace this implementation
export const callAttemptService: CallAttemptService = {
  async getAttempts(bookingId: string): Promise<CallAttemptRecord[]> {
    const allAttempts = getStoredAttempts();
    return allAttempts
      .filter(a => a.bookingId === bookingId)
      .sort((a, b) => a.attemptNumber - b.attemptNumber);
  },

  async logAttempt(params: LogCallAttemptParams): Promise<CallAttemptRecord> {
    const { bookingId, doctorId, answered, notes } = params;
    
    const allAttempts = getStoredAttempts();
    const bookingAttempts = allAttempts.filter(a => a.bookingId === bookingId);
    const nextAttemptNumber = bookingAttempts.length + 1;

    if (nextAttemptNumber > 3) {
      throw new Error('Maximum call attempts (3) reached');
    }

    const newAttempt: CallAttemptRecord = {
      id: crypto.randomUUID(),
      bookingId,
      doctorId,
      attemptNumber: nextAttemptNumber,
      attemptedAt: new Date().toISOString(),
      answered,
      notes: notes || null,
    };

    allAttempts.push(newAttempt);
    saveAttempts(allAttempts);

    return newAttempt;
  },

  canMarkNoShow(attempts: CallAttemptRecord[]): boolean {
    const failedAttempts = attempts.filter(a => !a.answered);
    return failedAttempts.length >= 3;
  },
};

// Future Supabase implementation (uncomment when ready)
/*
import { supabase } from '@/integrations/supabase/client';

export const callAttemptServiceSupabase: CallAttemptService = {
  async getAttempts(bookingId: string): Promise<CallAttemptRecord[]> {
    const { data, error } = await supabase
      .from('call_attempts')
      .select('id, booking_id, doctor_id, attempt_number, attempted_at, notes')
      .eq('booking_id', bookingId)
      .order('attempt_number', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      bookingId: row.booking_id,
      doctorId: row.doctor_id,
      attemptNumber: row.attempt_number,
      attemptedAt: row.attempted_at,
      answered: row.notes === 'Patient answered',
      notes: row.notes,
    }));
  },

  async logAttempt(params: LogCallAttemptParams): Promise<CallAttemptRecord> {
    const { bookingId, doctorId, answered, notes } = params;

    // Get current attempt count
    const { data: existing } = await supabase
      .from('call_attempts')
      .select('attempt_number')
      .eq('booking_id', bookingId)
      .order('attempt_number', { ascending: false })
      .limit(1);

    const nextAttempt = (existing?.[0]?.attempt_number || 0) + 1;

    if (nextAttempt > 3) {
      throw new Error('Maximum call attempts (3) reached');
    }

    const { data, error } = await supabase
      .from('call_attempts')
      .insert({
        booking_id: bookingId,
        doctor_id: doctorId,
        attempt_number: nextAttempt,
        notes: answered ? 'Patient answered' : (notes || 'No answer'),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      bookingId: data.booking_id,
      doctorId: data.doctor_id,
      attemptNumber: data.attempt_number,
      attemptedAt: data.attempted_at,
      answered,
      notes: data.notes,
    };
  },

  canMarkNoShow(attempts: CallAttemptRecord[]): boolean {
    const failedAttempts = attempts.filter(a => !a.answered);
    return failedAttempts.length >= 3;
  },
};
*/
