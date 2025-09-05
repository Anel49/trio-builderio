export interface ReservationPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
  renterName?: string;
  status: 'confirmed' | 'pending' | 'completed';
}

export interface ListingReservations {
  listingId: string;
  reservations: ReservationPeriod[];
}

// Mock reservations data for different listings
const mockReservations: Record<string, ReservationPeriod[]> = {
  // Lawn mower listing reservations
  '1': [
    {
      id: 'res-001',
      startDate: new Date('2025-06-15'),
      endDate: new Date('2025-06-17'),
      status: 'confirmed'
    },
    {
      id: 'res-002',
      startDate: new Date('2025-06-22'),
      endDate: new Date('2025-06-23'),
      status: 'confirmed'
    },
    {
      id: 'res-003',
      startDate: new Date('2025-07-05'),
      endDate: new Date('2025-07-08'),
      status: 'pending'
    },
    {
      id: 'res-004',
      startDate: new Date('2025-07-14'),
      endDate: new Date('2025-07-14'),
      status: 'confirmed'
    },
    {
      id: 'res-005',
      startDate: new Date('2025-08-20'),
      endDate: new Date('2025-08-22'),
      status: 'confirmed'
    },
    {
      id: 'res-006',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-09-03'),
      status: 'pending'
    }
  ],
  // Other listings would have their own reservations
  '2': [
    {
      id: 'res-101',
      startDate: new Date('2025-06-18'),
      endDate: new Date('2025-06-20'),
      status: 'confirmed'
    }
  ]
};

export const getListingReservations = (listingId: string): ReservationPeriod[] => {
  return mockReservations[listingId] || [];
};

export const getAllReservedDates = (listingId: string): Date[] => {
  const reservations = getListingReservations(listingId);
  const reservedDates: Date[] = [];

  reservations.forEach(reservation => {
    const currentDate = new Date(reservation.startDate);
    const endDate = new Date(reservation.endDate);

    while (currentDate <= endDate) {
      reservedDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  return reservedDates;
};

export const isDateInReservation = (date: Date, listingId: string): ReservationPeriod | null => {
  const reservations = getListingReservations(listingId);

  for (const reservation of reservations) {
    if (date >= reservation.startDate && date <= reservation.endDate) {
      return reservation;
    }
  }

  return null;
};

export const isDateRangeAvailable = (startDate: Date, endDate: Date, listingId: string): boolean => {
  const reservedDates = getAllReservedDates(listingId);
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const isReserved = reservedDates.some(
      reservedDate => reservedDate.toDateString() === currentDate.toDateString()
    );
    if (isReserved) {
      return false;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return true;
};

export const addReservation = (listingId: string, reservation: Omit<ReservationPeriod, 'id'>): string => {
  const newId = `res-${Date.now()}`;
  const newReservation: ReservationPeriod = {
    ...reservation,
    id: newId
  };

  if (!mockReservations[listingId]) {
    mockReservations[listingId] = [];
  }

  mockReservations[listingId].push(newReservation);
  return newId;
};
