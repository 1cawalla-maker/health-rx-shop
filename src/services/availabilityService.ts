// Availability Service - handles doctor availability management
// Phase 1: mock/localStorage only
import type { AvailabilitySlot, AvailabilityType, FiveMinuteSlot, BookingReservation, MockAvailabilityBlock, MockBooking } from '@/types/telehealth';

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

// Convert local time to UTC ISO string
export function convertToUTC(localDateTime: string, timezone: string): string {
  try {
    // Create a date object and format it properly
    const date = new Date(localDateTime);
    return date.toISOString();
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
};

export const availabilityService = {
  // Phase 1: Supabase-backed availability is disabled.
  // Use mockAvailabilityService for all availability and slot generation.
  async getDoctorAvailability(_doctorId: string): Promise<AvailabilitySlot[]> {
    console.warn('[Phase 1] availabilityService.getDoctorAvailability disabled');
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
