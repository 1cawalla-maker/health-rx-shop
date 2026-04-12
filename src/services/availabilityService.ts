// Availability Service - handles doctor availability management
// Phase 1: mock/localStorage only
import type { AvailabilitySlot, AvailabilityType, FiveMinuteSlot, BookingReservation, MockAvailabilityBlock, MockBooking } from '@/types/telehealth';
import { supabase } from '@/integrations/supabase/client';

// Constants
const SLOT_DURATION_MINUTES = 5;
const MOCK_AVAILABILITY_KEY = 'nicopatch_mock_availability';
const MOCK_BOOKINGS_KEY = 'nicopatch_mock_bookings';
const RESERVATIONS_KEY = 'nicopatch_reservations';
const DEFAULT_TIMEZONE = 'Australia/Brisbane';

// Map database row to AvailabilitySlot
function mapToAvailabilitySlot(row: any): AvailabilitySlot {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    availabilityType: row.availability_type,
    dayOfWeek: row.day_of_week,
    specificDate: row.specific_date,
    startTime: row.start_time,
    endTime: row.end_time,
    timezone: row.timezone,
    maxBookings: row.max_bookings,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Get timezone abbreviation (AEST vs AEDT)
export function getTimezoneAbbr(date: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-AU', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart?.value || 'AEST';
  } catch {
    return 'AEST';
  }
}

// Convert a "wall clock" local datetime (yyyy-MM-ddTHH:mm:ss) in a specific IANA timezone into a UTC ISO string.
// Note: JS Date parsing does NOT respect the provided timezone, so we must compute the offset using Intl.
function getZonedParts(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
  };
}

export function convertToUTC(localDateTime: string, timezone: string): string {
  try {
    // localDateTime expected: yyyy-MM-ddTHH:mm:ss
    const [datePart, timePartRaw] = localDateTime.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    const [hh, mm, ss = '0'] = timePartRaw.split(':');
    const H = Number(hh);
    const M = Number(mm);
    const S = Number(ss);

    // Start with a UTC guess using the same wall-clock components.
    const utcGuess = Date.UTC(y, m - 1, d, H, M, S);

    // Figure out what local time that UTC guess corresponds to in the target timezone.
    const zoned = getZonedParts(new Date(utcGuess), timezone);
    const zonedAsUTC = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second);

    // The difference is the timezone offset at that instant.
    const offsetMs = zonedAsUTC - utcGuess;

    // Correct the guess so that the target timezone's wall-clock time matches the input.
    const correctedUtc = utcGuess - offsetMs;
    return new Date(correctedUtc).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// Generate 5-minute slots from a block
export function generateFiveMinuteSlots(
  startTime: string,
  endTime: string,
  date: string,
  doctorId: string,
  timezone: string = DEFAULT_TIMEZONE
): FiveMinuteSlot[] {
  const slots: FiveMinuteSlot[] = [];
  let [hour, minute] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  // Calculate timezone abbreviation
  const testDate = new Date(`${date}T${startTime}:00`);
  const timezoneAbbr = getTimezoneAbbr(testDate, timezone);
  
  while (hour < endHour || (hour === endHour && minute < endMin)) {
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    
    // Create UTC timestamp
    const localDateTime = `${date}T${time}:00`;
    const utcTimestamp = convertToUTC(localDateTime, timezone);
    
    slots.push({
      time,
      date,
      utcTimestamp,
      doctorIds: [doctorId],
      isAvailable: true,
      displayTimezone: timezone,
      timezoneAbbr,
    });
    
    minute += SLOT_DURATION_MINUTES;
    if (minute >= 60) {
      minute = 0;
      hour += 1;
    }
  }
  return slots;
}

// Calculate number of 5-minute slots in a time range
export function calculateSlotCount(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return Math.floor((endMinutes - startMinutes) / SLOT_DURATION_MINUTES);
}

// Mock service for MVP (localStorage-based)
export const mockAvailabilityService = {
  // Get all mock availability blocks
  getMockDoctorBlocks(): MockAvailabilityBlock[] {
    const stored = localStorage.getItem(MOCK_AVAILABILITY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default mock data - doctors with different schedules
    const defaultBlocks: MockAvailabilityBlock[] = [
      {
        id: 'block-1',
        doctorId: 'mock-doc-1',
        doctorName: 'Dr. Sarah Chen',
        dayOfWeek: 1, // Monday
        specificDate: null,
        startTime: '09:00',
        endTime: '12:00',
        timezone: DEFAULT_TIMEZONE,
        isRecurring: true,
        isActive: true,
      },
      {
        id: 'block-2',
        doctorId: 'mock-doc-1',
        doctorName: 'Dr. Sarah Chen',
        dayOfWeek: 3, // Wednesday
        specificDate: null,
        startTime: '14:00',
        endTime: '17:00',
        timezone: DEFAULT_TIMEZONE,
        isRecurring: true,
        isActive: true,
      },
      {
        id: 'block-3',
        doctorId: 'mock-doc-2',
        doctorName: 'Dr. Michael Thompson',
        dayOfWeek: 1, // Monday - overlaps with Dr. Chen
        specificDate: null,
        startTime: '10:00',
        endTime: '14:00',
        timezone: DEFAULT_TIMEZONE,
        isRecurring: true,
        isActive: true,
      },
      {
        id: 'block-4',
        doctorId: 'mock-doc-2',
        doctorName: 'Dr. Michael Thompson',
        dayOfWeek: 2, // Tuesday
        specificDate: null,
        startTime: '09:00',
        endTime: '13:00',
        timezone: DEFAULT_TIMEZONE,
        isRecurring: true,
        isActive: true,
      },
      {
        id: 'block-5',
        doctorId: 'mock-doc-3',
        doctorName: 'Dr. Emily Patel',
        dayOfWeek: 4, // Thursday
        specificDate: null,
        startTime: '08:00',
        endTime: '12:00',
        timezone: DEFAULT_TIMEZONE,
        isRecurring: true,
        isActive: true,
      },
      {
        id: 'block-6',
        doctorId: 'mock-doc-3',
        doctorName: 'Dr. Emily Patel',
        dayOfWeek: 5, // Friday
        specificDate: null,
        startTime: '09:00',
        endTime: '15:00',
        timezone: DEFAULT_TIMEZONE,
        isRecurring: true,
        isActive: true,
      },
    ];
    
    localStorage.setItem(MOCK_AVAILABILITY_KEY, JSON.stringify(defaultBlocks));
    return defaultBlocks;
  },

  // Check if a block matches a specific date
  blockMatchesDate(block: MockAvailabilityBlock, date: string): boolean {
    if (!block.isActive) return false;
    
    if (block.specificDate) {
      return block.specificDate === date;
    }
    
    if (block.isRecurring && block.dayOfWeek !== null) {
      const dateObj = new Date(date);
      return dateObj.getDay() === block.dayOfWeek;
    }
    
    return false;
  },

  // Get bookings from localStorage
  getMockBookings(): MockBooking[] {
    const stored = localStorage.getItem(MOCK_BOOKINGS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // Get reservations from localStorage
  getReservations(): BookingReservation[] {
    const stored = localStorage.getItem(RESERVATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // Get active (non-expired) reservations
  getActiveReservations(): BookingReservation[] {
    const now = Date.now();
    const reservations = this.getReservations();
    const active = reservations.filter(r => new Date(r.expiresAt).getTime() > now);
    
    // Clean up expired ones
    if (active.length !== reservations.length) {
      localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(active));
    }
    
    return active;
  },

  // Create a reservation
  createReservation(
    patientId: string,
    doctorId: string,
    date: string,
    time: string,
    utcTimestamp: string
  ): BookingReservation {
    const reservations = this.getReservations();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min TTL
    
    const reservation: BookingReservation = {
      id: crypto.randomUUID(),
      patientId,
      doctorId,
      date,
      time,
      utcTimestamp,
      expiresAt,
    };
    
    reservations.push(reservation);
    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
    return reservation;
  },

  // Release a reservation
  releaseReservation(reservationId: string): void {
    const reservations = this.getReservations().filter(r => r.id !== reservationId);
    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
  },

  // Aggregate slots by time (merge doctorIds for same time)
  aggregateSlotsByTime(slots: FiveMinuteSlot[]): FiveMinuteSlot[] {
    const timeMap = new Map<string, FiveMinuteSlot>();
    
    for (const slot of slots) {
      const key = `${slot.date}-${slot.time}`;
      if (timeMap.has(key)) {
        const existing = timeMap.get(key)!;
        existing.doctorIds = [...new Set([...existing.doctorIds, ...slot.doctorIds])];
      } else {
        timeMap.set(key, { ...slot });
      }
    }
    
    return Array.from(timeMap.values())
      .filter(s => s.doctorIds.length > 0)
      .sort((a, b) => a.time.localeCompare(b.time));
  },

  // Remove times where doctor is already booked/reserved
  subtractBookedSlots(
    slots: FiveMinuteSlot[],
    bookings: MockBooking[],
    reservations: BookingReservation[]
  ): FiveMinuteSlot[] {
    return slots.map(slot => {
      const availableDoctors = slot.doctorIds.filter(docId => {
        // Check bookings
        const isBooked = bookings.some(b => 
          b.doctorId === docId && 
          b.scheduledDate === slot.date && 
          b.timeWindowStart === slot.time &&
          b.status !== 'cancelled'
        );
        
        // Check active reservations
        const isReserved = reservations.some(r =>
          r.doctorId === docId &&
          r.date === slot.date &&
          r.time === slot.time
        );
        
        return !isBooked && !isReserved;
      });
      
      return {
        ...slot,
        doctorIds: availableDoctors,
        isAvailable: availableDoctors.length > 0,
      };
    }).filter(s => s.isAvailable);
  },

  // Get aggregated slots for a date (merges all doctors)
  getAggregatedSlotsForDate(date: string): FiveMinuteSlot[] {
    const blocks = this.getMockDoctorBlocks();
    const bookings = this.getMockBookings();
    const reservations = this.getActiveReservations();
    
    // Generate slots from all matching blocks
    const allSlots: FiveMinuteSlot[] = [];
    
    for (const block of blocks) {
      if (this.blockMatchesDate(block, date)) {
        const slots = generateFiveMinuteSlots(
          block.startTime,
          block.endTime,
          date,
          block.doctorId,
          block.timezone
        );
        allSlots.push(...slots);
      }
    }
    
    // Aggregate by time (merge doctorIds for same time)
    const aggregated = this.aggregateSlotsByTime(allSlots);
    
    // Remove booked/reserved doctor-times
    return this.subtractBookedSlots(aggregated, bookings, reservations);
  },

  // Get dates with availability in a range
  getDatesWithAvailability(startDate: Date, endDate: Date): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const slots = this.getAggregatedSlotsForDate(dateStr);
      if (slots.length > 0) {
        dates.push(dateStr);
      }
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  },

  // Doctor-scoped CRUD for Phase 1 availability management
  getDoctorBlocks(doctorId: string): MockAvailabilityBlock[] {
    return this.getMockDoctorBlocks().filter((b) => b.doctorId === doctorId);
  },

  addDoctorBlock(
    doctorId: string,
    block: Omit<MockAvailabilityBlock, 'id' | 'doctorId' | 'doctorName' | 'isActive'>
  ): MockAvailabilityBlock {
    const blocks = this.getMockDoctorBlocks();
    const newBlock: MockAvailabilityBlock = {
      id: crypto.randomUUID(),
      doctorId,
      doctorName: '',
      isActive: true,
      ...block,
    };
    blocks.push(newBlock);
    localStorage.setItem(MOCK_AVAILABILITY_KEY, JSON.stringify(blocks));
    return newBlock;
  },

  removeDoctorBlock(doctorId: string, blockId: string): boolean {
    const blocks = this.getMockDoctorBlocks();
    const filtered = blocks.filter((b) => !(b.id === blockId && b.doctorId === doctorId));
    if (filtered.length === blocks.length) return false;
    localStorage.setItem(MOCK_AVAILABILITY_KEY, JSON.stringify(filtered));
    return true;
  },
};

// NOTE: We now support explicit per-date availability via `doctor_availability_blocks`.
// A doctor is unavailable by default unless they add one or more blocks for a date.
export const doctorAvailabilityDateBlocksService = {
  async listForDoctorInRange(params: {
    doctorRowId: string;
    startDate: string; // yyyy-MM-dd
    endDate: string;   // yyyy-MM-dd (inclusive)
  }): Promise<MockAvailabilityBlock[]> {
    const { data, error } = await (supabase as any)
      .from('doctor_availability_blocks')
      .select('*')
      .eq('doctor_id', params.doctorRowId)
      .gte('date', params.startDate)
      .lte('date', params.endDate)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;

    return (data || []).map((r: any) => {
      const dateStr = String(r.date);
      // dateStr is yyyy-MM-dd, safe to new Date(...) at midnight local; we only need day column mapping.
      const dayOfWeek = new Date(`${dateStr}T00:00:00`).getDay();
      return {
        id: r.id,
        doctorId: r.doctor_id,
        doctorName: '',
        dayOfWeek,
        specificDate: dateStr,
        startTime: (r.start_time || '').slice(0, 5),
        endTime: (r.end_time || '').slice(0, 5),
        timezone: r.timezone,
        isRecurring: false,
        isActive: true,
      } as any;
    });
  },

  async addBlock(params: {
    doctorRowId: string;
    date: string; // yyyy-MM-dd
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    timezone: string;
  }): Promise<void> {
    // Avoid noisy unique-constraint toasts when a doctor re-saves the exact same block.
    // DB unique index: (doctor_id, date, start_time, end_time)
    const { error } = await (supabase as any)
      .from('doctor_availability_blocks')
      .upsert(
        {
          doctor_id: params.doctorRowId,
          date: params.date,
          start_time: params.startTime,
          end_time: params.endTime,
          timezone: params.timezone,
        },
        {
          onConflict: 'doctor_id,date,start_time,end_time',
          ignoreDuplicates: true,
        }
      );

    if (error) throw error;
  },

  async removeBlock(params: { doctorRowId: string; blockId: string }): Promise<void> {
    const { error } = await (supabase as any)
      .from('doctor_availability_blocks')
      .delete()
      .eq('id', params.blockId)
      .eq('doctor_id', params.doctorRowId);

    if (error) throw error;
  },
};

export const supabaseAvailabilityService = {
  async getDatesWithAvailability(minDate: Date, maxDate: Date): Promise<string[]> {
    // Explicit per-date availability: return all distinct dates that have >=1 availability block.
    const start = new Date(minDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(maxDate);
    end.setHours(0, 0, 0, 0);

    const yyyy1 = start.getFullYear();
    const mm1 = String(start.getMonth() + 1).padStart(2, '0');
    const dd1 = String(start.getDate()).padStart(2, '0');
    const startStr = `${yyyy1}-${mm1}-${dd1}`;

    const yyyy2 = end.getFullYear();
    const mm2 = String(end.getMonth() + 1).padStart(2, '0');
    const dd2 = String(end.getDate()).padStart(2, '0');
    const endStr = `${yyyy2}-${mm2}-${dd2}`;

    const { data, error } = await (supabase as any)
      .from('doctor_availability_blocks')
      .select('date')
      .gte('date', startStr)
      .lte('date', endStr);

    if (error) throw error;

    const set = new Set<string>();
    for (const row of data || []) {
      if (row?.date) set.add(String(row.date));
    }

    return Array.from(set).sort();
  },

  async getAggregatedSlotsForDate(dateStr: string): Promise<FiveMinuteSlot[]> {
    const { data, error } = await (supabase as any)
      .from('doctor_availability_blocks')
      .select('doctor_id,start_time,end_time,timezone,date')
      .eq('date', dateStr);

    if (error) throw error;

    // Aggregate doctor slots by time.
    const byTime = new Map<string, FiveMinuteSlot>();

    for (const row of data || []) {
      const slots = generateFiveMinuteSlots(
        (row.start_time || '').slice(0, 5),
        (row.end_time || '').slice(0, 5),
        dateStr,
        row.doctor_id,
        row.timezone || DEFAULT_TIMEZONE,
      );

      for (const s of slots) {
        const existing = byTime.get(s.time);
        if (!existing) {
          byTime.set(s.time, { ...s });
        } else {
          const set = new Set(existing.doctorIds);
          for (const id of s.doctorIds) set.add(id);
          existing.doctorIds = Array.from(set);
          existing.isAvailable = existing.doctorIds.length > 0;
        }
      }
    }

    let slots = Array.from(byTime.values())
      .filter((s) => (s.doctorIds || []).length > 0)
      .sort((a, b) => a.time.localeCompare(b.time));

    // Subtract server-side holds (consultation_reservations)
    try {
      if (slots.length) {
        const utcTimes = slots.map((s) => new Date(s.utcTimestamp).getTime()).sort((a, b) => a - b);
        const startIso = new Date(utcTimes[0]).toISOString();
        const endIso = new Date(utcTimes[utcTimes.length - 1] + 5 * 60 * 1000).toISOString();

        const { data: reservations, error: resErr } = await supabase
          .from('consultation_reservations')
          .select('scheduled_at, doctor_id, expires_at, status')
          .gte('scheduled_at', startIso)
          .lt('scheduled_at', endIso)
          .in('status', ['active', 'confirmed']);

        if (resErr) throw resErr;

        const now = Date.now();
        const blocking = (reservations || []).filter((r: any) => {
          if (r.status === 'confirmed') return true;
          return new Date(r.expires_at).getTime() > now;
        });

        const byUtc = new Map<string, { doctorIds: (string | null)[] }>();
        for (const r of blocking) {
          const key = new Date(r.scheduled_at).toISOString();
          const arr = byUtc.get(key) || { doctorIds: [] as (string | null)[] };
          arr.doctorIds.push((r as any).doctor_id ?? null);
          byUtc.set(key, arr);
        }

        slots = slots
          .map((s) => {
            const key = new Date(s.utcTimestamp).toISOString();
            const block = byUtc.get(key);
            if (!block) return s;

            // If we don't know reserved doctor, be conservative and block the whole time.
            if (block.doctorIds.some((d) => !d)) {
              return { ...s, doctorIds: [], isAvailable: false };
            }

            const reservedSet = new Set(block.doctorIds.filter(Boolean) as string[]);
            const remaining = (s.doctorIds || []).filter((d) => !reservedSet.has(d));
            return { ...s, doctorIds: remaining, isAvailable: remaining.length > 0 };
          })
          .filter((s) => (s.doctorIds || []).length > 0);
      }
    } catch (e) {
      console.error('Failed to subtract reservations from availability:', e);
    }

    return slots;
  },
};

export const availabilityService = {
  // Phase 2 (in progress): public availability slots are still mock-derived.
  // We are first wiring doctor availability CRUD to Supabase via doctorAvailabilityBlocksService.
  async getDoctorAvailability(_doctorId: string): Promise<AvailabilitySlot[]> {
    console.warn('[Phase 2] availabilityService.getDoctorAvailability not wired yet');
    return [];
  },

  async createRecurringSlot(): Promise<AvailabilitySlot> {
    throw new Error('Availability management will be enabled in Phase 2');
  },

  async createOneOffSlot(): Promise<AvailabilitySlot> {
    throw new Error('Availability management will be enabled in Phase 2');
  },

  async createBlockedSlot(): Promise<AvailabilitySlot> {
    throw new Error('Availability management will be enabled in Phase 2');
  },

  async removeSlot(): Promise<void> {
    throw new Error('Availability management will be enabled in Phase 2');
  },

  async deleteSlot(): Promise<void> {
    throw new Error('Availability management will be enabled in Phase 2');
  },

  async getAvailableSlotsForDate(): Promise<
    { slotId: string; doctorId: string; startTime: string; endTime: string; availableCapacity: number }[]
  > {
    console.warn('[Phase 1] availabilityService.getAvailableSlotsForDate disabled');
    return [];
  },

  async updateSlotCapacity(): Promise<void> {
    throw new Error('Availability management will be enabled in Phase 2');
  },
};
