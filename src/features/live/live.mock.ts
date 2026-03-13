import { BookingRequest, GigEvent, Venue } from '@/interfaces/live';

export interface LiveData {
  venues: Venue[];
  bookings: BookingRequest[];
  gigs: GigEvent[];
}

export const liveMockData: LiveData = {
  venues: [
    {
      id: 'venue-1',
      name: 'Circolo Nord',
      city: 'Milano',
      contactName: 'Marta B.',
      contactEmail: 'booking@circolonord.it',
    },
    {
      id: 'venue-2',
      name: 'Factory Club',
      city: 'Bologna',
      contactName: 'Luca R.',
      contactEmail: 'live@factoryclub.it',
    },
    {
      id: 'venue-3',
      name: 'Lido Stage',
      city: 'Rimini',
      contactName: 'Anna V.',
      contactEmail: 'events@lidostage.it',
    },
  ],
  bookings: [
    {
      id: 'booking-1',
      venueId: 'venue-1',
      requestedDate: '2026-03-14T21:00:00.000Z',
      status: 'requested',
      feeProposal: 850,
      createdAt: '2026-01-10T12:00:00.000Z',
      updatedAt: '2026-01-20T12:00:00.000Z',
    },
    {
      id: 'booking-2',
      venueId: 'venue-2',
      requestedDate: '2026-04-02T21:30:00.000Z',
      status: 'negotiating',
      feeProposal: 1200,
      createdAt: '2026-01-08T12:00:00.000Z',
      updatedAt: '2026-01-24T12:00:00.000Z',
    },
    {
      id: 'booking-3',
      venueId: 'venue-3',
      requestedDate: '2026-04-28T20:30:00.000Z',
      status: 'rejected',
      createdAt: '2026-01-15T12:00:00.000Z',
      updatedAt: '2026-01-21T12:00:00.000Z',
      notes: 'Venue fully booked for spring dates.',
    },
  ],
  gigs: [
    {
      id: 'gig-1',
      venueId: 'venue-1',
      date: '2026-02-20T21:30:00.000Z',
      status: 'confirmed',
      title: 'Winter Session',
      setlistName: 'Power Set',
    },
    {
      id: 'gig-2',
      venueId: 'venue-2',
      date: '2026-03-04T21:00:00.000Z',
      status: 'confirmed',
      title: 'Factory Loud Night',
      setlistName: 'Tour Set A',
      notes: 'Hello BellllllL!',
    },
    {
      id: 'gig-3',
      venueId: 'venue-3',
      date: '2026-03-20T19:30:00.000Z',
      status: 'cancelled',
      title: 'Sea Sound Fest',
      notes: 'Promoter cancelled due to weather risk.',
    },
  ],
};
