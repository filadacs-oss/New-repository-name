export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export interface Email {
  id: string;
  userId: string;
  subject: string;
  content: string;
  sender: string;
  timestamp: string;
  isRead: boolean;
  summary?: string;
  category?: 'Work' | 'Personal' | 'Promotions' | 'Social' | 'Other';
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
}

export interface Flight {
  id: string;
  userId: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  price: number;
  status: 'search_result' | 'booked';
  flightNumber?: string;
  gate?: string;
  liveStatus?: 'On Time' | 'Delayed' | 'Boarding' | 'Departed' | 'Landed';
  delayMinutes?: number;
  delayReason?: string;
  personalNote?: string;
  rating?: number;
  stops?: number;
  hasInsurance?: boolean;
  insuranceDetails?: {
    provider: string;
    policyNumber: string;
    type: string;
  };
  boardingPassUrl?: string;
  isCheckedIn?: boolean;
}

export interface Review {
  id: string;
  userId: string;
  targetId: string; // flightId or hotelId
  targetType: 'flight' | 'hotel';
  targetName: string; // Airline name or Hotel name
  rating: number;
  comment: string;
  timestamp: string;
}

export interface PriceAlert {
  id: string;
  userId: string;
  origin?: string;
  destination: string; // For hotels, this is the hotel name or city
  targetType: 'flight' | 'hotel';
  maxPrice: number;
  status: 'active' | 'triggered' | 'disabled';
}

export interface Hotel {
  id: string;
  userId: string;
  name: string;
  location: string;
  checkIn: string;
  checkOut: string;
  pricePerNight: number;
  totalPrice: number;
  starRating?: number;
  amenities?: string[];
  cancellationPolicy?: string;
  isCheckedIn?: boolean;
  confirmationNumber?: string;
  reviews?: Review[];
  status: 'search_result' | 'booked';
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  type: 'income' | 'expense';
  timestamp: string;
}

export interface JobApplication {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
  link: string;
  salaryRange?: string;
  location?: string;
}

export interface CreditCard {
  id: string;
  userId: string;
  lastFour: string;
  brand: string;
  expiry: string;
  type?: 'physical' | 'virtual';
  status?: 'active' | 'frozen' | 'closed';
  balance?: number;
}

export interface ShoppingItem {
  id: string;
  userId: string;
  name: string;
  brand: string;
  price: number;
  link: string;
  image?: string;
}

export interface TrainTicket {
  id: string;
  userId: string;
  origin: string;
  destination: string;
  departureTime: string;
  operator: string;
  price: number;
  status: 'available' | 'booked';
}

export interface BusTicket {
  id: string;
  userId: string;
  origin: string;
  destination: string;
  departureTime: string;
  operator: string;
  price: number;
  status: 'available' | 'booked';
}

export interface NavigationFavorite {
  id: string;
  userId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface CarRental {
  id: string;
  userId: string;
  company: string;
  model: string;
  location: string;
  pickupTime: string;
  returnTime: string;
  price: number;
  type?: 'SUV' | 'Sedan' | 'Hatchback' | 'Luxury' | 'Convertible';
  transmission?: 'Automatic' | 'Manual';
  fuelEfficiency?: string;
  status: 'available' | 'booked';
}

export type PaymentMethod = 'credit_card' | 'paypal' | 'klarna' | 'apple_pay';

export interface TravelAlert {
  id: string;
  userId: string;
  tripId: string;
  type: 'delay' | 'gate_change' | 'traffic' | 'weather' | 'price_drop';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  isRead: boolean;
}

export interface TaxiBooking {
  id: string;
  userId: string;
  origin: string;
  destination: string;
  pickupTime: string;
  price: number;
  driverName?: string;
  carModel?: string;
  estimatedArrival?: string;
  status: 'available' | 'booked' | 'arriving' | 'at_pickup' | 'in_progress' | 'completed';
  currentLocation?: { lat: number, lng: number };
  progress?: number; // 0 to 1
}

export interface ReceiptItem {
  name: string;
  price: number;
}

export interface Receipt {
  id: string;
  userId: string;
  items?: ReceiptItem[];
  itemName: string;
  amount: number;
  date: string;
  storeName: string;
  orderNumber: string;
  status: 'ready_for_pickup' | 'picked_up';
  type: 'electronics' | 'groceries' | 'fashion' | 'other';
  paymentMethod?: string;
  receiptUrl?: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  flightPreferences?: {
    seatType?: string;
    airline?: string;
    loyaltyNumber?: string;
  };
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'tool_call' | 'tool_result' | 'alert';
  timestamp?: string;
  acknowledged?: boolean;
  alertData?: TravelAlert;
}
