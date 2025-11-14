export interface ReservationPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
  renterName?: string;
  status: "accepted" | "pending" | "completed";
}

export interface ListingReservations {
  listingId: string;
  reservations: ReservationPeriod[];
}

// Mock reservations data for different listings
const mockReservations: Record<string, ReservationPeriod[]> = {
  // Lawn mower listing reservations
  "1": [
    {
      id: "res-001",
      startDate: new Date("2025-10-15"),
      endDate: new Date("2025-10-17"),
      status: "accepted",
    },
    {
      id: "res-002",
      startDate: new Date("2025-09-22"),
      endDate: new Date("2025-09-28"),
      status: "accepted",
    },
    {
      id: "res-003",
      startDate: new Date("2025-11-05"),
      endDate: new Date("2025-11-08"),
      status: "pending",
    },
    {
      id: "res-004",
      startDate: new Date("2025-12-14"),
      endDate: new Date("2025-12-23"),
      status: "accepted",
    },
    {
      id: "res-005",
      startDate: new Date("2025-12-20"),
      endDate: new Date("2025-12-24"),
      status: "accepted",
    },
    {
      id: "res-006",
      startDate: new Date("2025-12-01"),
      endDate: new Date("2025-12-03"),
      status: "pending",
    },
  ],
  // Other listings reservations
  "2": [
    {
      id: "res-101",
      startDate: new Date("2025-06-18"),
      endDate: new Date("2025-06-20"),
      status: "accepted",
    },
    {
      id: "res-102",
      startDate: new Date("2025-07-10"),
      endDate: new Date("2025-07-12"),
      status: "completed",
    },
  ],
  "3": [
    {
      id: "res-201",
      startDate: new Date("2025-08-05"),
      endDate: new Date("2025-08-07"),
      status: "accepted",
    },
    {
      id: "res-202",
      startDate: new Date("2025-09-10"),
      endDate: new Date("2025-09-12"),
      status: "pending",
    },
  ],
  "4": [
    {
      id: "res-301",
      startDate: new Date("2025-10-01"),
      endDate: new Date("2025-10-04"),
      status: "accepted",
    },
  ],
  "5": [
    {
      id: "res-401",
      startDate: new Date("2025-11-20"),
      endDate: new Date("2025-11-22"),
      status: "pending",
    },
    {
      id: "res-402",
      startDate: new Date("2025-12-05"),
      endDate: new Date("2025-12-06"),
      status: "accepted",
    },
  ],
  // Listing 6 intentionally has no reservations
  "6": [],
};

export const getListingReservations = (
  listingId: string,
): ReservationPeriod[] => {
  return mockReservations[listingId] || [];
};

export const getAllReservedDates = (listingId: string): Date[] => {
  const reservations = getListingReservations(listingId);
  const reservedDates: Date[] = [];

  reservations.forEach((reservation) => {
    const currentDate = new Date(reservation.startDate);
    const endDate = new Date(reservation.endDate);
    // Add 1 day to include the end date in the reservation (end date is inclusive)
    endDate.setDate(endDate.getDate() + 1);

    while (currentDate < endDate) {
      reservedDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  return reservedDates;
};

export const getPendingOrAcceptedReservedDates = (listingId: string): Date[] => {
  const reservations = getListingReservations(listingId);
  const reservedDates: Date[] = [];

  reservations.forEach((reservation) => {
    // Only include pending or accepted reservations
    if (reservation.status !== "pending" && reservation.status !== "accepted") {
      return;
    }

    const currentDate = new Date(reservation.startDate);
    const endDate = new Date(reservation.endDate);
    // Add 1 day to include the end date in the reservation (end date is inclusive)
    endDate.setDate(endDate.getDate() + 1);

    while (currentDate < endDate) {
      reservedDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  return reservedDates;
};

export const isDateInReservation = (
  date: Date,
  listingId: string,
): ReservationPeriod | null => {
  const reservations = getListingReservations(listingId);

  for (const reservation of reservations) {
    if (date >= reservation.startDate && date <= reservation.endDate) {
      return reservation;
    }
  }

  return null;
};

export const isDateRangeAvailable = (
  startDate: Date,
  endDate: Date,
  listingId: string,
): boolean => {
  const reservedDates = getPendingOrAcceptedReservedDates(listingId);
  console.log(
    `Checking availability for listing ${listingId}: Reserved dates: ${reservedDates.map((d) => d.toISOString()).join(", ")}`,
  );

  const currentDate = new Date(startDate);
  // Add 1 day to end date to make it inclusive
  const inclusiveEndDate = new Date(endDate);
  inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);

  while (currentDate < inclusiveEndDate) {
    const isReserved = reservedDates.some(
      (reservedDate) =>
        reservedDate.toDateString() === currentDate.toDateString(),
    );
    if (isReserved) {
      console.log(
        `Listing ${listingId}: Date ${currentDate.toDateString()} is reserved`,
      );
      return false;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`Listing ${listingId}: Available`);
  return true;
};

export const addReservation = (
  listingId: string,
  reservation: Omit<ReservationPeriod, "id">,
): string => {
  const newId = `res-${Date.now()}`;
  const newReservation: ReservationPeriod = {
    ...reservation,
    id: newId,
  };

  if (!mockReservations[listingId]) {
    mockReservations[listingId] = [];
  }

  mockReservations[listingId].push(newReservation);
  return newId;
};
