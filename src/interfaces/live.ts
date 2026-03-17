export type BookingStatus =
  | 'draft'
  | 'requested'
  | 'negotiating'
  | 'confirmed'
  | 'rejected'
  | 'cancelled';

export interface Venue {
  id: string;
  name: string;
  city?: string;
  address?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

export interface BookingRequest {
  id: string;
  venueId: string;
  requestedDate?: string; // ISO
  status: BookingStatus;
  feeProposal?: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  notes?: string;
  gigId?: string;
}

export interface GigEvent {
  id: string;
  venueId: string;
  date: string; // ISO
  status: BookingStatus;
  title: string;
  setlistName?: string;
  notes?: string;
  bookingId?: string;
}
