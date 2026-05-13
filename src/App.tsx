/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Send, Mail, Calendar, Plane, User as UserIcon, LogOut, Loader2,
  MapPin, Clock, Search, Briefcase, Plus, Filter, MessageSquare, AlertCircle, 
  X, ChevronRight, Layout, Wallet, CreditCard as CardIcon, ShoppingBag, 
  Settings, Bell, Image as ImageIcon, Map as MapIcon, Compass, Sparkles,
  TrendingUp, TrendingDown, DollarSign, ArrowRight, Star, Building2, 
  TrainFront, Bus, Navigation, Car, Smartphone, Laptop, Trash2, Shield,
  ChevronDown, RefreshCw, Share2, Locate, Map as MapUiIcon, Zap,
  Grip, Upload, Camera, Banknote, MoreHorizontal, AlertTriangle, ClipboardCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, Legend } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth, googleProvider } from './lib/firebase';
import { processAssistantRequest, generateEmailSummary } from './services/geminiService';
import { 
  emailService, 
  calendarService, 
  flightService, 
  hotelService, 
  financialService,
  vaultService,
  jobService,
  shoppingService,
  trainService,
  busService,
  navigationService,
  carRentalService,
  taxiService,
  priceAlertService,
  reviewService,
  purchaseService,
  chatService,
  alertService,
  receiptService
} from './services/dbService';
import { 
  Message, 
  Email, 
  CalendarEvent, 
  Flight, 
  Hotel, 
  Transaction,
  JobApplication,
  CreditCard,
  ShoppingItem,
  TrainTicket,
  BusTicket,
  NavigationFavorite,
  CarRental,
  TaxiBooking,
  PriceAlert,
  Review,
  TravelAlert,
  PaymentMethod,
  Receipt
} from './types';
import { format } from 'date-fns';

const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidMapsKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY';

const ALL_AIRLINES = [
  'Delta Air Lines', 'American Airlines', 'United Airlines', 'Southwest Airlines', 'Lufthansa', 
  'Air France', 'British Airways', 'Emirates', 'Qatar Airways', 'Singapore Airlines', 
  'Cathay Pacific', 'ANA (All Nippon Airways)', 'Japan Airlines', 'Turkish Airlines', 
  'KLM', 'Swiss International Air Lines', 'Austrian Airlines', 'LOT Polish Airlines',
  'Eurowings', 'Ryanair', 'EasyJet', 'Air Canada', 'Quantas', 'Etihad Airways',
  'Air China', 'China Eastern', 'China Southern', 'Korean Air', 'Iberia', 'TAP Air Portugal',
  'Finnair', 'Norwegian', 'Scandinavian Airlines', 'Thai Airways', 'Vietnam Airlines',
  'Garuda Indonesia', 'Avianca', 'LATAM Airlines', 'Copa Airlines', 'Aeromexico',
  'Delta', 'Spirit Airlines', 'JetBlue', 'Alaska Airlines', 'Frontier Airlines'
];

const TransactionChart = ({ transactions }: { transactions: Transaction[] }) => {
  const categoryData = transactions.reduce((acc: any[], curr) => {
    if (curr.type === 'expense') {
      const existing = acc.find(a => a.name === curr.category);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount });
      }
    }
    return acc;
  }, []);

  const COLORS = ['#171717', '#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={categoryData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {categoryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <ReTooltip 
            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const ProactiveAlertCard = ({ alert, onDismiss }: { alert: TravelAlert, onDismiss: () => void }) => {
  const iconMap: any = { delay: <Clock size={20} />, price_drop: <TrendingDown size={20} />, gate: <MapPin size={20} />, traffic: <Car size={20} /> };
  const colorMap: any = { 
    high: 'border-red-500 bg-red-50 text-red-900', 
    medium: 'border-blue-500 bg-blue-50 text-blue-900', 
    low: 'border-neutral-500 bg-neutral-50 text-neutral-900' 
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`flex items-center p-5 mb-4 border-l-4 rounded-r-2xl shadow-xl backdrop-blur-md relative overflow-hidden group ${colorMap[alert.severity || 'medium']}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
      <div className="text-2xl mr-4 shrink-0 opacity-80">
        {iconMap[alert.type] || <Zap size={20} />}
      </div>
      <div className="flex-grow min-w-0 pr-8">
        <h4 className="font-black text-[8px] uppercase tracking-[0.2em] opacity-60 mb-0.5">{alert.title}</h4>
        <p className="text-sm font-bold leading-tight">{alert.message}</p>
      </div>
      <button 
        onClick={onDismiss}
        className="bg-neutral-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
      >
        Dismiss
      </button>
      <button 
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 opacity-20 hover:opacity-100 transition-opacity"
      >
        <X size={10} />
      </button>
    </motion.div>
  );
};

const SpendingTrends = ({ transactions }: { transactions: Transaction[] }) => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const data = last7Days.map(date => {
    const dailyTotal = transactions
      .filter(t => t.type === 'expense' && t.timestamp.startsWith(date))
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      date: format(new Date(date), 'MMM d'),
      amount: dailyTotal
    };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="date" hide />
          <YAxis hide />
          <ReTooltip 
            cursor={{ fill: 'rgba(0,0,0,0.05)', radius: 8 }}
            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Bar 
            dataKey="amount" 
            fill="#171717" 
            radius={[8, 8, 0, 0]}
            animationDuration={1500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'chat' | 'emails' | 'calendar' | 'flights' | 'hotels' | 'money' | 'vault' | 'agent' | 'navigation' | 'travel' | 'shopping' | 'cars'>('chat');
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week');
  const [emailSort, setEmailSort] = useState<'newest' | 'oldest'>('newest');
  const [activeEmailTab, setActiveEmailTab] = useState<'All' | 'Work' | 'Personal' | 'Promotions' | 'Social' | 'Other'>('All');
  const [emailSummary, setEmailSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const [txSortBy, setTxSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [txSortOrder, setTxSortOrder] = useState<'asc' | 'desc'>('desc');
  const [flightFilter, setFlightFilter] = useState({ 
    maxPrice: 2000, 
    airline: '', 
    maxStops: 3,
    departureTimeRange: [0, 24], // Hours
    arrivalTimeRange: [0, 24],    // Hours
    origin: '',
    destination: ''
  });
  const [showPriceAlertForm, setShowPriceAlertForm] = useState(false);
  const [newAlert, setNewAlert] = useState({ origin: '', destination: '', maxPrice: 500, targetType: 'flight' as const });
  const [hotelFilter, setHotelFilter] = useState({ maxPrice: 1000, minRating: 0, amenities: [] as string[] });
  const [rentalFilter, setRentalFilter] = useState({ 
    maxPrice: 500, 
    company: '',
    type: '' as any,
    transmission: '' as any,
    minFuelEfficiency: ''
  });
  const [taxiSearch, setTaxiSearch] = useState({ origin: '', destination: '' });
  const [showTaxiResults, setShowTaxiResults] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [alerts, setAlerts] = useState<TravelAlert[]>([]);
  const [shoppingRecs, setShoppingRecs] = useState<ShoppingItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('credit_card');
  const [showAlerts, setShowAlerts] = useState(false);
  const [txFilter, setTxFilter] = useState({ type: 'all', category: 'all', date: '' });
  const [jobFilter, setJobFilter] = useState({ location: '', minSalary: 0, status: 'all' });
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [addingTrain, setAddingTrain] = useState(false);
  const [newTrain, setNewTrain] = useState<Partial<TrainTicket>>({ origin: '', destination: '', departureTime: '', operator: '', price: 0 });
  const [addingBus, setAddingBus] = useState(false);
  const [newBus, setNewBus] = useState<Partial<BusTicket>>({ origin: '', destination: '', departureTime: '', operator: '', price: 0 });
  const [authError, setAuthError] = useState<string | null>(null);
  const [confirmingItem, setConfirmingItem] = useState<{ type: 'flight' | 'hotel' | 'train' | 'bus' | 'car' | 'taxi', data: any } | null>(null);
  const [insuranceOptedIn, setInsuranceOptedIn] = useState(false);
  const [insuranceDetails, setInsuranceDetails] = useState({ provider: 'Nexus Care', policyNumber: 'NX12345', type: 'Premium Cover' });

  const [cancellingItem, setCancellingItem] = useState<{ type: 'flight', data: Flight } | null>(null);
  const [viewingTicket, setViewingTicket] = useState<any | null>(null);
  const [viewingBoardingPass, setViewingBoardingPass] = useState<Flight | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const [emails, setEmails] = useState<Email[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);

  useEffect(() => {
    const addInitialHotels = async () => {
      const hasAdded = localStorage.getItem('hotelsAdded');
      if (hasAdded) return;
      
      const hotels = [
        { name: 'Hilton Berlin', location: 'Berlin', pricePerNight: 200, starRating: 5, amenities: ['Wifi', 'Gym', 'Restaurant'] },
        { name: 'ibis Berlin Kurfürstendamm', location: 'Berlin', pricePerNight: 90, starRating: 3, amenities: ['Wifi', 'Breakfast'] },
        { name: 'Hotel Indigo BERLIN - KU\'DAMM by IHG', location: 'Berlin', pricePerNight: 150, starRating: 4, amenities: ['Wifi', 'Gym'] },
        { name: 'ibis Berlin Messe', location: 'Berlin', pricePerNight: 85, starRating: 3, amenities: ['Wifi'] },
        { name: 'Ibis Berlin Spandau', location: 'Berlin', pricePerNight: 80, starRating: 3, amenities: ['Wifi'] },
        { name: 'NYX Hotel Berlin Köpenick by Leonardo Hotels', location: 'Berlin', pricePerNight: 120, starRating: 4, amenities: ['Wifi', 'Bar'] },
        { name: 'Moxy Berlin Humboldthain Park', location: 'Berlin', pricePerNight: 85, starRating: 3, amenities: ['Wifi', 'Bar'] },
      ];
      for (const h of hotels) {
        await hotelService.addSearchResult(h as any);
      }
      localStorage.setItem('hotelsAdded', 'true');
      const updatedHotels = await hotelService.getHotels();
      setHotels(updatedHotels);
    };
    addInitialHotels();
  }, []);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [trains, setTrains] = useState<TrainTicket[]>([]);
  const [buses, setBuses] = useState<BusTicket[]>([]);
  const [navigationFavs, setNavigationFavs] = useState<NavigationFavorite[]>([]);
  const [cars, setCars] = useState<CarRental[]>([]);
  const [taxis, setTaxis] = useState<TaxiBooking[]>([]);

  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewingItem, setReviewingItem] = useState<{ id: string, type: 'flight' | 'hotel', name: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const safeDate = (date: any) => {
    if (!date) return null;
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
  };

  const safeFormat = (date: any, formatStr: string, fallback = 'N/A') => {
    const d = safeDate(date);
    if (!d) return fallback;
    try {
      return format(d, formatStr);
    } catch (e) {
      return fallback;
    }
  };

  const addMessage = async (msg: Omit<Message, 'timestamp'>, skipSave = false) => {
    setMessages(prev => [...prev, msg]);
    if (!skipSave && user) {
      await chatService.saveMessage(msg);
    }
  };

  const [mapCenter, setMapCenter] = useState({ lat: 51.5074, lng: -0.1278 }); // London
  const [mapZoom, setMapZoom] = useState(12);

  const filteredEmails = useMemo(() => {
    let list = emails.filter(e => 
      (activeEmailTab === 'All' || e.category === activeEmailTab) &&
      (e.subject.toLowerCase().includes(emailFilter.toLowerCase()) || 
       e.sender.toLowerCase().includes(emailFilter.toLowerCase()))
    );
    return list.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return emailSort === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [emails, emailFilter, activeEmailTab, emailSort]);

  const filteredTransactions = useMemo(() => {
    let list = transactions.filter(t => 
      (txFilter.type === 'all' || t.type === txFilter.type) &&
      (txFilter.category === 'all' || t.category === txFilter.category) &&
      (!txFilter.date || safeFormat(t.timestamp, 'yyyy-MM-dd') === txFilter.date)
    );
    return list.sort((a, b) => {
      let comparison = 0;
      if (txSortBy === 'date') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (txSortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else {
        comparison = a.description.localeCompare(b.description);
      }
      return txSortOrder === 'desc' ? -comparison : comparison;
    });
  }, [transactions, txFilter, txSortBy, txSortOrder]);

  const filteredFlights = flights.filter(f => {
    const d = safeDate(f.departureTime);
    const a = safeDate(f.arrivalTime);
    const depHour = d ? d.getUTCHours() : 0;
    const arrHour = a ? a.getUTCHours() : 0;
    
    return f.price <= flightFilter.maxPrice && 
    (flightFilter.airline === '' || f.airline === flightFilter.airline) &&
    (f.stops === undefined || f.stops <= flightFilter.maxStops) &&
    (depHour >= flightFilter.departureTimeRange[0] && depHour <= flightFilter.departureTimeRange[1]) &&
    (arrHour >= flightFilter.arrivalTimeRange[0] && arrHour <= flightFilter.arrivalTimeRange[1]) &&
    (flightFilter.origin === '' || f.origin.toLowerCase().includes(flightFilter.origin.toLowerCase())) &&
    (flightFilter.destination === '' || f.destination.toLowerCase().includes(flightFilter.destination.toLowerCase()));
  });

  const filteredHotels = hotels.filter(h => 
    h.pricePerNight <= hotelFilter.maxPrice && 
    (h.starRating || 0) >= hotelFilter.minRating &&
    (hotelFilter.amenities.length === 0 || hotelFilter.amenities.every(a => h.amenities?.includes(a)))
  );

  const filteredRentals = cars.filter(c => 
    c.price <= rentalFilter.maxPrice &&
    (rentalFilter.company === '' || c.company === rentalFilter.company) &&
    (rentalFilter.type === '' || c.type === rentalFilter.type) &&
    (rentalFilter.transmission === '' || c.transmission === rentalFilter.transmission) &&
    (rentalFilter.minFuelEfficiency === '' || parseInt(c.fuelEfficiency || '0') >= parseInt(rentalFilter.minFuelEfficiency))
  );

  const filteredJobs = jobs.filter(job => {
    const meetLocation = jobFilter.location === '' || (job.location || '').toLowerCase().includes(jobFilter.location.toLowerCase());
    const meetStatus = jobFilter.status === 'all' || job.status === jobFilter.status;
    let meetSalary = true;
    if (jobFilter.minSalary > 0) {
      if (!job.salaryRange) {
        meetSalary = false;
      } else {
        const matches = job.salaryRange.replace(/,/g, '').match(/\d+/g);
        if (matches) {
          const salaries = matches.map(Number);
          const maxJobSalary = Math.max(...salaries);
          if (maxJobSalary < jobFilter.minSalary) meetSalary = false;
        } else {
          meetSalary = false;
        }
      }
    }
    return meetLocation && meetStatus && meetSalary;
  });

  const handleBookFlight = async (flight: Flight) => {
    setConfirmingItem({ type: 'flight', data: flight });
  };

  const handleCancelFlight = async (flight: Flight) => {
    setCancellingItem({ type: 'flight', data: flight });
  };

  const cancelBooking = async () => {
    if (!cancellingItem) return;
    setLoading(true);
    if (cancellingItem.type === 'flight') {
      await flightService.deleteFlight(cancellingItem.data.id);
    }
    setCancellingItem(null);
    setViewingTicket(null);
    await refreshData();
    setLoading(false);
  };

  const updateFlightNote = async (id: string, note: string) => {
    await flightService.updateFlight(id, { personalNote: note });
    await refreshData();
    // Refresh the local viewingTicket state
    setViewingTicket((prev: any) => ({ ...prev, personalNote: note }));
  };

  const handleBookHotel = async (hotel: Hotel) => {
    setConfirmingItem({ type: 'hotel', data: hotel });
  };

  const handleBookTrain = async (train: TrainTicket) => {
    setConfirmingItem({ type: 'train', data: train });
  };

  const handleBookBus = async (bus: BusTicket) => {
    setConfirmingItem({ type: 'bus', data: bus });
  };

  const handleBookCar = async (car: CarRental) => {
    setConfirmingItem({ type: 'car', data: car });
  };

  const handleBookTaxi = async (taxi: TaxiBooking) => {
    setConfirmingItem({ type: 'taxi', data: taxi });
  };

  const handleCheckIn = async (item: Flight | Hotel, type: 'flight' | 'hotel') => {
    setLoading(true);
    try {
      if (type === 'flight') {
        const flight = item as Flight;
        const res = await flightService.checkIn(flight.id);
        addMessage({ role: 'assistant', content: `Check-in successful for your flight to ${flight.destination}. Your boarding pass is now available.` });
      } else {
        const hotel = item as Hotel;
        const res = await hotelService.checkIn(hotel.id);
        addMessage({ role: 'assistant', content: `Check-in successful for ${hotel.name}. Confirmation code: ${res.confirmationNumber}` });
      }
      await refreshData();
    } catch (error) {
      addMessage({ role: 'assistant', content: `Check-in failed. Please try again or visit the counter.` });
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async () => {
    if (!confirmingItem) return;
    setLoading(true);
    if (confirmingItem.type === 'flight') {
      const flightData: Flight = confirmingItem.data;
      if (insuranceOptedIn) {
        flightData.hasInsurance = true;
        flightData.insuranceDetails = insuranceDetails;
      }
      if (flightData.id) {
        await flightService.updateFlight(flightData.id, { 
          ...flightData, 
          status: 'booked',
          flightNumber: `NX-${Math.floor(100 + Math.random() * 900)}`,
          gate: ['A', 'B', 'C'][Math.floor(Math.random() * 3)] + Math.floor(Math.random() * 30),
          liveStatus: 'On Time'
        });
      } else {
        await flightService.bookFlight({ 
          ...flightData, 
          flightNumber: `NX-${Math.floor(100 + Math.random() * 900)}`,
          gate: ['A', 'B', 'C'][Math.floor(Math.random() * 3)] + Math.floor(Math.random() * 30),
          liveStatus: 'On Time'
        });
      }
    } else if (confirmingItem.type === 'hotel') {
      if (confirmingItem.data.id) {
        await hotelService.updateHotel(confirmingItem.data.id, { status: 'booked' });
      } else {
        await hotelService.bookHotel(confirmingItem.data);
      }
    } else if (confirmingItem.type === 'train') {
      await trainService.addTicket({ ...confirmingItem.data, status: 'booked' });
    } else if (confirmingItem.type === 'bus') {
      await busService.addTicket({ ...confirmingItem.data, status: 'booked' });
    } else if (confirmingItem.type === 'car') {
      if (confirmingItem.data.id) {
        await carRentalService.updateRental(confirmingItem.data.id, { status: 'booked' });
      } else {
        await carRentalService.bookRental(confirmingItem.data);
      }
    } else if (confirmingItem.type === 'taxi') {
      const taxiData = {
        ...confirmingItem.data,
        driverName: confirmingItem.data.driverName || ["David", "Michael", "Sarah", "Alex", "James"][Math.floor(Math.random() * 5)],
        carModel: confirmingItem.data.carModel || ["Mercedes S-Class", "Tesla Model S", "BMW 7 Series", "Audi A8", "Lexus LS"][Math.floor(Math.random() * 5)],
        estimatedArrival: confirmingItem.data.estimatedArrival || `${Math.floor(3 + Math.random() * 8)} mins`,
        status: 'booked' as const
      };
      
      if (confirmingItem.data.id) {
        await taxiService.updateTaxi(confirmingItem.data.id, taxiData);
      } else {
        await taxiService.bookTaxi(taxiData);
      }
      
      setConfirmingItem(null);
      addMessage({ 
        role: 'assistant', 
        content: `Taxi Confirmed! Driver ${taxiData.driverName} in a ${taxiData.carModel} will arrive at ${taxiData.origin} in ${taxiData.estimatedArrival}.` 
      });
      await refreshData();
      setLoading(false);
      return;
    }

    setConfirmingItem(null);
    setInsuranceOptedIn(false);
    addMessage({ 
      role: 'assistant', 
      content: `Booking Finished! Your ${confirmingItem.type} has been successfully confirmed. You can view the details in the ${confirmingItem.type === 'flight' || confirmingItem.type === 'hotel' ? confirmingItem.type : 'travel'} tab.` 
    });
    await refreshData();
    setLoading(false);
  };

  const chatEndRef = useRef<HTMLDivElement>(null);
  const flightsRef = useRef<Flight[]>([]);

  useEffect(() => {
    flightsRef.current = flights;
  }, [flights]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = flightService.subscribeToFlightUpdates(user.uid, (updatedFlights) => {
      // Find flights that changed status
      updatedFlights.forEach(newFlight => {
        const oldFlight = flightsRef.current.find(f => f.id === newFlight.id);
        if (oldFlight) {
          if (newFlight.status !== oldFlight.status) {
            addMessage({ role: 'assistant', content: `Flight Alert: Your flight to ${newFlight.destination} has changed to ${newFlight.status} status.` });
          }
          if (newFlight.liveStatus === 'Delayed' && newFlight.delayMinutes !== oldFlight.delayMinutes) {
            addMessage({ role: 'assistant', content: `Flight Alert: Your flight to ${newFlight.destination} is delayed by ${newFlight.delayMinutes} minutes due to ${newFlight.delayReason || 'unforeseen circumstances'}.` });
          }
        }
      });
      setFlights(updatedFlights);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        seedAndRefresh(u.uid);
      }
    });
    return unsubscribe;
  }, []);

  const seedAndRefresh = async (userId: string) => {
    const [e, ev, f, h, tx, c, j, s, t, b, n, cr, txs, rc] = await Promise.all([
      emailService.getEmails(),
      calendarService.getEvents(),
      flightService.getFlights(),
      hotelService.getHotels(),
      financialService.getTransactions(),
      vaultService.getCards(),
      jobService.getJobs(),
      shoppingService.getItems(),
      trainService.getTickets(),
      busService.getTickets(),
      navigationService.getFavorites(),
      carRentalService.getRentals(),
      taxiService.getBookings(),
      receiptService.getReceipts()
    ]);
    
    // Seed if empty
    if (rc.length === 0) {
      await receiptService.addReceipt({
        itemName: "iPhone 15 Pro, 256GB, Natural Titanium",
        items: [{ name: "iPhone 15 Pro", price: 1099 }],
        amount: 1099,
        date: new Date().toISOString(),
        storeName: "Apple Store, Kurfürstendamm",
        orderNumber: "W123456789",
        status: 'ready_for_pickup',
        type: 'electronics',
        paymentMethod: "Virtual Visa *4421"
      });
      await receiptService.addReceipt({
        itemName: "MacBook Air M3, 13-inch",
        items: [
          { name: "MacBook Air M3", price: 1099 },
          { name: "13-inch Sleeve", price: 49 },
          { name: "USB-C Hub", price: 151 }
        ],
        amount: 1299,
        date: new Date(Date.now() - 86400000).toISOString(),
        storeName: "Cyberport, Friedrichstraße",
        orderNumber: "CP-987654321",
        status: 'picked_up',
        type: 'electronics',
        paymentMethod: "Apple Pay (Visa *4421)"
      });
      await receiptService.addReceipt({
        itemName: "Sony WH-1000XM5 Headphones",
        items: [{ name: "Sony WH-1000XM5", price: 349 }],
        amount: 349,
        date: new Date(Date.now() - 172800000).toISOString(),
        storeName: "Saturn, Europa-Center",
        orderNumber: "S-554433221",
        status: 'picked_up',
        type: 'electronics',
        paymentMethod: "Apple Pay (Visa *4421)"
      });
    }

    if (c.length === 0) {
      await vaultService.addCard({
        lastFour: "4421",
        brand: "Visa",
        expiry: "09/27",
        type: 'virtual',
        status: 'active',
        balance: 2450.75
      });
      await vaultService.addCard({
        lastFour: "1288",
        brand: "Mastercard",
        expiry: "12/25",
        type: 'physical',
        status: 'active'
      });
    }
    if (ev.length === 0) {
      await calendarService.addEvent({
        title: "Important Meeting with Bank",
        startTime: new Date(new Date().getTime() + 2 * 60 * 60000).toISOString(),
        endTime: new Date(new Date().getTime() + 3 * 60 * 60000).toISOString(),
        location: "City Bank HQ",
        description: "Review financial strategy and vault security."
      });
    }

    if (f.length === 0) {
      await flightService.bookFlight({
        origin: "London Heathrow",
        destination: "Prague",
        departureTime: new Date(new Date().getTime() + 24 * 60 * 60000).toISOString(),
        arrivalTime: new Date(new Date().getTime() + 26 * 60 * 60000).toISOString(),
        airline: "Nexus Air",
        price: 450,
        status: 'booked',
        flightNumber: "NX-101",
        gate: "B12",
        liveStatus: 'Delayed',
        delayMinutes: 45,
        delayReason: "Late arrival of incoming aircraft due to weather in Frankfurt."
      });
    }

    if (e.length === 0) {
      await emailService.createEmail({
        userId,
        subject: "Welcome to Nexus Assistant",
        content: "Hi there! I'm your new personal assistant. You can ask me to check your emails, summarize them, or even book a flight. Try asking me 'Book a flight to Prague for next Friday'.",
        sender: "Nexus Team",
        timestamp: new Date().toISOString(),
        isRead: false
      });
    }

    if (tx.length === 0) {
      await financialService.addTransaction({
        amount: 1200,
        category: "Salary",
        description: "Monthly Payout",
        type: "income",
        timestamp: new Date().toISOString()
      });
      await financialService.addTransaction({
        amount: 45,
        category: "Lifestyle",
        description: "Premium Clothing Store",
        type: "expense",
        timestamp: new Date().toISOString()
      });
      await financialService.addTransaction({
        amount: 1299,
        category: "Electronics",
        description: "MacBook Air M3 @ Cyberport",
        type: "expense",
        timestamp: new Date(Date.now() - 86400000).toISOString()
      });
      await financialService.addTransaction({
        amount: 349,
        category: "Electronics",
        description: "Sony Headphones @ Saturn",
        type: "expense",
        timestamp: new Date(Date.now() - 172800000).toISOString()
      });
    }

    if (t.length === 0) {
      await trainService.addTicket({
        origin: "London St Pancras",
        destination: "Paris Gare du Nord",
        departureTime: "May 15, 09:30",
        operator: "Eurostar",
        price: 95,
        status: 'booked'
      });
    }

    if (b.length === 0) {
      await busService.addTicket({
        origin: "Berlin Alexanderplatz",
        destination: "Prague Main Station",
        departureTime: "May 20, 14:00",
        operator: "FlixBus",
        price: 22,
        status: 'booked'
      });
    }

    if (n.length === 0) {
      const stores = [
        { name: "Apple Store Kurfürstendamm", address: "Kurfürstendamm 26, 10719 Berlin", lat: 52.5034, lng: 13.3292 },
        { name: "Saturn Alexanderplatz", address: "Alexanderplatz 3, 10178 Berlin", lat: 52.5222, lng: 13.4130 },
        { name: "MediaMarkt Tech Village (Alexa)", address: "Grunerstraße 20, 10179 Berlin", lat: 52.5212, lng: 13.4147 },
        { name: "Cyberport Friedrichstraße", address: "Friedrichstraße 50-55, 10117 Berlin", lat: 52.5135, lng: 13.3888 },
        { name: "Notebooksbilliger.de", address: "Leipziger Str. 96, 10117 Berlin", lat: 52.5105, lng: 13.3880 },
        { name: "K&M Computer Mitte", address: "Alexanderstraße 3, 10178 Berlin", lat: 52.5230, lng: 13.4150 },
        { name: "Caseking Store", address: "Gaußstraße 1, 10589 Berlin", lat: 52.5265, lng: 13.3035 },
        { name: "Home", address: "10 Downing St, London", lat: 51.5033, lng: -0.1276 },
        { name: "Google UK", address: "6 Pancras Square, London", lat: 51.5333, lng: -0.1264 }
      ];
      for (const store of stores) {
        await navigationService.addFavorite(store);
      }
    }

    if (cr.length === 0) {
      await carRentalService.bookRental({
        company: "Hertz",
        model: "Tesla Model S",
        location: "London Heathrow",
        pickupTime: new Date(new Date().getTime() + 48 * 60 * 60000).toISOString(),
        returnTime: new Date(new Date().getTime() + 120 * 60 * 60000).toISOString(),
        price: 250,
        status: 'booked'
      });
      await carRentalService.bookRental({
        company: "Sixt",
        model: "BMW i4",
        location: "Berlin Airport",
        pickupTime: new Date(new Date().getTime() + 168 * 60 * 60000).toISOString(),
        returnTime: new Date(new Date().getTime() + 240 * 60 * 60000).toISOString(),
        price: 320,
        status: 'booked'
      });
    }

    if (txs.length === 0) {
       await taxiService.bookTaxi({
         origin: "10 Downing St",
         destination: "London Heathrow",
         pickupTime: "May 22, 08:30",
         price: 65,
         driverName: "Sarah",
         carModel: "Toyota Prius",
         status: 'booked'
       });
    }

    if (h.length === 0) {
      await hotelService.bookHotel({
        name: "The Grand Prague",
        location: "Old Town Square, Prague",
        checkIn: "2024-06-15",
        checkOut: "2024-06-20",
        starRating: 5,
        pricePerNight: 180,
        totalPrice: 900,
        amenities: ['Wi-Fi', 'Pool', 'Breakfast', 'Gym'],
        cancellationPolicy: "Full refund if cancelled at least 48 hours before check-in.",
        status: 'booked'
      });
    }

    refreshData();
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'en-US';

      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recog.onerror = () => {
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      // 1. Price Alerts Check
      const activeAlerts = priceAlerts.filter(a => a.status === 'active');
      if (activeAlerts.length > 0) {
        for (const alert of activeAlerts) {
          const currentPrice = 50 + Math.random() * 800;
          if (currentPrice < alert.maxPrice) {
            await priceAlertService.updateAlert(alert.id, { status: 'triggered' });
            const message = `PRICE ALERT: The ${alert.targetType === 'hotel' ? 'hotel' : 'flight'} ${alert.origin ? `from ${alert.origin} to ` : ''}${alert.destination} is now $${currentPrice.toFixed(0)}, which is below your $${alert.maxPrice} threshold!`;
            addMessage({ role: 'assistant', content: message });
            await alertService.addAlert({
              tripId: alert.id,
              type: 'price_drop',
              title: 'Price Drop Alert',
              message: message,
              severity: 'medium'
            });
          }
        }
      }

      // 2. Flight Status & Traffic Check (Proactive)
      const bookedFlights = flights.filter(f => f.status === 'booked');
      if (bookedFlights.length > 0) {
        // Randomly simulate a delay, gate change, or traffic alert (15% chance)
        if (Math.random() > 0.85) {
          const flightToUpdate = bookedFlights[Math.floor(Math.random() * bookedFlights.length)];
          const updateType = Math.random();
          
          if (updateType < 0.33) {
            // Delay
            const updates = [
              { liveStatus: 'Delayed' as const, delayReason: 'Late Arrival of Incoming Aircraft', delayMinutes: 45 },
              { liveStatus: 'Delayed' as const, delayReason: 'Weather Conditions', delayMinutes: 120 }
            ];
            const update = updates[Math.floor(Math.random() * updates.length)];
            await flightService.updateFlight(flightToUpdate.id, update);
            const message = `FLIGHT DELAY: Your flight ${flightToUpdate.airline} to ${flightToUpdate.destination} is now DELAYED by ${update.delayMinutes}m due to ${update.delayReason}.`;
            addMessage({ role: 'assistant', content: message });
            await alertService.addAlert({
              tripId: flightToUpdate.id,
              type: 'delay',
              title: 'Flight Delay Alert',
              message,
              severity: 'high'
            });
          } else if (updateType < 0.66) {
            // Gate Change
            const newGate = `A${Math.floor(Math.random() * 20) + 1}`;
            await flightService.updateFlight(flightToUpdate.id, { gate: newGate });
            const message = `GATE CHANGE: Your flight ${flightToUpdate.airline} to ${flightToUpdate.destination} is now departing from Gate ${newGate}.`;
            addMessage({ role: 'assistant', content: message });
            await alertService.addAlert({
              tripId: flightToUpdate.id,
              type: 'gate_change',
              title: 'Gate Change Alert',
              message,
              severity: 'medium'
            });
          } else {
            // Traffic Condition
            const message = `TRAFFIC ALERT: Heavy traffic reported on the way to ${flightToUpdate.origin}. We recommend leaving 20 minutes earlier than planned.`;
            addMessage({ role: 'assistant', content: message });
            await alertService.addAlert({
              tripId: flightToUpdate.id,
              type: 'traffic',
              title: 'Traffic Alert',
              message,
              severity: 'medium'
            });
          }
        }
      }

      // 3. Taxi Status Simulator
      const bookedTaxis = taxis.filter(t => t.status !== 'completed' && t.status !== 'available');
      if (bookedTaxis.length > 0) {
        for (const taxi of bookedTaxis) {
          let newStatus = taxi.status;
          let newProgress = (taxi.progress || 0) + 0.1;

          if (newProgress >= 1) {
            newProgress = 0;
            switch(taxi.status) {
              case 'booked': newStatus = 'arriving'; break;
              case 'arriving': newStatus = 'at_pickup'; break;
              case 'at_pickup': newStatus = 'in_progress'; break;
              case 'in_progress': newStatus = 'completed'; break;
            }
          }
          
          await taxiService.updateTaxi(taxi.id, { 
            status: newStatus, 
            progress: newProgress,
            estimatedArrival: newStatus === 'arriving' ? `${Math.floor((1 - newProgress) * 10)} mins` : 
                             newStatus === 'at_pickup' ? 'At Location' :
                             newStatus === 'in_progress' ? `${Math.floor((1 - newProgress) * 20)} mins` : 'Arrived'
          });

          if (newStatus !== taxi.status && newStatus !== 'completed') {
            addMessage({ 
              role: 'assistant', 
              content: `TAXI UPDATE: Your ride is now ${newStatus.replace('_', ' ')}.` 
            }, true);
          }
        }
      }

      await refreshData();
    }, 10000); // Check more frequently for demo (10s)
    return () => clearInterval(interval);
  }, [user, priceAlerts, flights, taxis]);

  useEffect(() => {
    const addInitialHistory = async () => {
      const storageKey = 'historyPurchasesAdded';
      if (localStorage.getItem(storageKey)) return;
      
      const history: Omit<Transaction, 'id' | 'userId'>[] = [
        { amount: 50, category: 'Food', description: 'Lunch at Cafe', type: 'expense', timestamp: new Date(2026, 4, 1).toISOString() },
        { amount: 1500, category: 'Rent', description: 'Apartment Rent', type: 'expense', timestamp: new Date(2026, 4, 1).toISOString() },
        { amount: 200, category: 'Electronics', description: 'Wireless Headphones', type: 'expense', timestamp: new Date(2026, 4, 5).toISOString() }
      ];
      await purchaseService.addPurchaseHistory(history);
      localStorage.setItem(storageKey, 'true');
      await refreshData();
    };
    if (user) addInitialHistory();
  }, [user]);

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      recognition?.start();
      setIsListening(true);
    }
  };

  const refreshData = async () => {
    const [e, ev, f, h, tx, c, j, s, t, b, n, cr, txs, pa, rFlight, rHotel, msgs, al, sr, rc] = await Promise.all([
      emailService.getEmails(),
      calendarService.getEvents(),
      flightService.getFlights(),
      hotelService.getHotels(),
      financialService.getTransactions(),
      vaultService.getCards(),
      jobService.getJobs(),
      shoppingService.getItems(),
      trainService.getTickets(),
      busService.getTickets(),
      navigationService.getFavorites(),
      carRentalService.getRentals(),
      taxiService.getBookings(),
      priceAlertService.getAlerts(),
      reviewService.getTargetReviews('flight'),
      reviewService.getTargetReviews('hotel'),
      chatService.getMessages(),
      alertService.getAlerts(),
      shoppingService.getRecommendations(),
      receiptService.getReceipts()
    ]);
    setEmails(e);
    setEvents(ev);
    setFlights(f);
    setHotels(h);
    setTransactions(tx);
    setCards(c);
    setJobs(j);
    setShopping(s);
    setTrains(t);
    setBuses(b);
    setNavigationFavs(n);
    setCars(cr);
    setTaxis(txs);
    setPriceAlerts(pa);
    setReviews([...rFlight, ...rHotel]);
    setAlerts(al);
    setShoppingRecs(sr);
    setReceipts(rc);
    if (messages.length === 0 && msgs.length > 0) {
      setMessages(msgs);
    }
  };

  const handleAddReview = async () => {
    if (!reviewingItem) return;
    await reviewService.addReview({
      targetId: reviewingItem.id,
      targetType: reviewingItem.type,
      targetName: reviewingItem.name,
      rating: reviewRating,
      comment: reviewComment
    });
    setReviewingItem(null);
    setReviewRating(5);
    setReviewComment('');
    await refreshData();
  };

  const getItemRating = (targetId: string) => {
    const itemReviews = reviews.filter(r => r.targetId === targetId);
    if (itemReviews.length === 0) return null;
    const avg = itemReviews.reduce((acc, curr) => acc + curr.rating, 0) / itemReviews.length;
    return avg.toFixed(1);
  };
  const handleAddPriceAlert = async () => {
    await priceAlertService.addAlert(newAlert);
    setShowPriceAlertForm(false);
    await refreshData();
  };

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked. Please allow popups for this site and click sign-in again.');
      } else {
        setAuthError('An error occurred during sign-in. Please try again.');
      }
    }
  };

  const handleLogout = () => signOut(auth);

  const suggestedActions = [
    { label: 'Check my emails', icon: <Mail size={14} /> },
    { label: 'What is on my calendar?', icon: <Calendar size={14} /> },
    { label: 'Book a flight to London', icon: <Plane size={14} /> },
    { label: 'Help me find a job', icon: <Briefcase size={14} /> },
    { label: 'Check my money', icon: <Wallet size={14} /> },
    { label: 'Find a hotel in Paris', icon: <Building2 size={14} /> },
  ];

  const sendMessage = async (text?: string) => {
    const userMsg = text || input;
    if (!userMsg.trim()) return;

    const userMessage: Message = { role: 'user', content: userMsg };
    setInput('');
    setLoading(true);
    await addMessage(userMessage);

    try {
      const response = await processAssistantRequest(userMsg, messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      })));
      const assistantMessage: Message = { role: 'assistant', content: response };
      await addMessage(assistantMessage);
      await refreshData();
    } catch (error) {
      console.error(error);
      await addMessage({ role: 'assistant', content: "I'm sorry, I encountered an error processing your request." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Basic reminder system: check for events in the next 15 minutes
    const interval = setInterval(() => {
      const now = new Date();
      const soon = new Date(now.getTime() + 15 * 60000);
      const upcoming = events.find(ev => {
        const start = new Date(ev.startTime);
        return start > now && start <= soon;
      });

      if (upcoming) {
        // Prevent duplicate reminders
        if (messages.some(m => m.content.includes(upcoming.title))) return;
        addMessage({ role: 'assistant', content: `Reminder: You have "${upcoming.title}" starting at ${safeFormat(upcoming.startTime, 'h:mm a')}.` });
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [events]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F0F2F5]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 glass-panel rounded-3xl max-w-sm w-full text-center space-y-6"
        >
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-200">
            <Plane className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nexus Assistant</h1>
            <p className="text-neutral-500 mt-2">Log in to manage your world.</p>
          </div>
          {authError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium border border-red-100">
              {authError}
            </div>
          )}
          <button 
            onClick={handleLogin}
            className="w-full py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
          >
            <UserIcon size={18} /> Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F9F9F8]">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white flex flex-col p-4 space-y-2 hidden md:flex">
        <div className="flex items-center gap-3 px-2 py-4 mb-4">
          <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
            <Plane className="text-white shrink-0" size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight">Nexus</span>
        </div>

        <button 
          onClick={() => setView('chat')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'chat' ? 'bg-neutral-900 text-white shadow-md' : 'hover:bg-neutral-50 text-neutral-600'}`}
        >
          <Send size={18} /> <span>Assistant</span>
        </button>
        <button 
          onClick={() => setView('emails')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'emails' ? 'bg-neutral-900 text-white shadow-md' : 'hover:bg-neutral-50 text-neutral-600'}`}
        >
          <Mail size={18} /> <span>Emails</span>
        </button>
        <button 
          onClick={() => setView('calendar')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'calendar' ? 'bg-neutral-900 text-white shadow-md' : 'hover:bg-neutral-50 text-neutral-600'}`}
        >
          <Calendar size={18} /> <span>Calendar</span>
        </button>
        <button 
          onClick={() => setView('flights')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'flights' ? 'bg-neutral-900 text-white shadow-md' : 'hover:bg-neutral-50 text-neutral-600'}`}
        >
          <Plane size={18} /> <span>Flights</span>
        </button>
        <button 
          onClick={() => setView('hotels')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'hotels' ? 'bg-neutral-900 text-white shadow-md' : 'hover:bg-neutral-50 text-neutral-600'}`}
        >
          <Building2 size={18} /> <span>Hotels</span>
        </button>
        <button 
          onClick={() => setView('money')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'money' ? 'bg-neutral-900 text-white shadow-md' : 'hover:bg-neutral-50 text-neutral-600'}`}
        >
          <Wallet size={18} /> <span>Money</span>
        </button>
        <button 
          onClick={() => setView('shopping')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'shopping' ? 'bg-neutral-900 text-white shadow-md' : 'hover:bg-neutral-50 text-neutral-600'}`}
        >
          <ShoppingBag size={18} /> <span>Shops</span>
        </button>
        <button 
          onClick={() => setView('cars')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'cars' ? 'bg-neutral-900 text-white shadow-md' : 'hover:bg-neutral-50 text-neutral-600'}`}
        >
          <Car size={18} /> <span>Rentals</span>
        </button>
        <button 
          onClick={() => setView('vault')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'vault' ? 'bg-neutral-900 text-white shadow-md' : 'hover:bg-neutral-50 text-neutral-600'}`}
        >
          <Shield size={18} /> <span>Vault</span>
        </button>
        <button 
          onClick={() => setView('agent')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'agent' ? 'bg-neutral-900 text-white shadow-md' : 'hover:bg-neutral-50 text-neutral-600'}`}
        >
          <Briefcase size={18} /> <span>Careers</span>
        </button>
        <button 
          onClick={() => setView('travel')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'travel' ? 'bg-neutral-900 text-white shadow-md' : 'hover:bg-neutral-50 text-neutral-600'}`}
        >
          <Train size={18} /> <span>Travel</span>
        </button>
        <button 
          onClick={() => setView('navigation')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'navigation' ? 'bg-neutral-900 text-white shadow-md' : 'hover:bg-neutral-50 text-neutral-600'}`}
        >
          <Navigation size={18} /> <span>Navigation</span>
        </button>

        <div className="flex-1" />
        
        <div className="p-4 border-t flex items-center gap-3">
          <img src={user?.photoURL || ''} className="w-8 h-8 rounded-full border" alt="Profile" />
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-medium truncate">{user?.displayName}</p>
            <button onClick={handleLogout} className="text-[10px] text-red-500 hover:underline">Sign out</button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white md:bg-transparent relative">
        <AnimatePresence>
          {showAlerts && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="absolute top-16 right-6 w-96 bg-white rounded-3xl shadow-2xl border border-neutral-100 z-50 overflow-hidden"
            >
              <div className="p-4 border-b flex items-center justify-between bg-neutral-50">
                <h3 className="font-bold flex items-center gap-2">
                  <Bell size={16} /> Alerts Center
                </h3>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">Proactive</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto p-2 space-y-2">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <ClipboardCheck size={32} className="mx-auto text-neutral-200" />
                    <p className="text-xs text-neutral-500 font-medium">All clear! No new alerts for Filip.</p>
                  </div>
                ) : (
                  alerts.slice().reverse().map((alert) => (
                    <motion.div 
                      key={alert.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        alert.severity === 'high' ? 'bg-red-50 border-red-100' : 
                        alert.severity === 'medium' ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg ${
                          alert.severity === 'high' ? 'bg-red-200 text-red-600' : 
                          alert.severity === 'medium' ? 'bg-orange-200 text-orange-600' : 'bg-blue-200 text-blue-600'
                        }`}>
                          {alert.type === 'delay' ? <Clock size={14} /> : 
                           alert.type === 'gate_change' ? <Plane size={14} /> :
                           alert.type === 'price_drop' ? <TrendingDown size={14} /> :
                           alert.type === 'traffic' ? <Car size={14} /> : <Zap size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-neutral-900">{alert.title}</p>
                          <p className="text-[10px] text-neutral-600 leading-tight mt-0.5">{alert.message}</p>
                          <p className="text-[9px] text-neutral-400 mt-1 font-medium">{safeFormat(alert.timestamp, 'h:mm a')}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              <div className="p-3 border-t bg-neutral-50">
                <button 
                  onClick={() => setShowAlerts(false)}
                  className="w-full py-2 bg-neutral-900 text-white rounded-xl text-[10px] font-bold hover:bg-neutral-800 transition-colors"
                >
                  Dismiss All
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="h-16 border-b bg-white/80 backdrop-blur-md px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold capitalize">{view}</h2>
            {loading && <Loader2 className="animate-spin text-blue-500" size={16} />}
          </div>
          <div className="flex gap-4 items-center">
            {alerts.length > 0 && alerts.slice(-1).map(alert => (
              <div key={alert.id} className="hidden xl:block">
                 <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full">
                    <Zap size={12} className="text-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest truncate max-w-[200px]">{alert.title}</span>
                 </div>
              </div>
            ))}
            <button 
              onClick={() => setShowAlerts(!showAlerts)}
              className="relative p-2 text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <Bell size={20} />
              {alerts.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </button>
            {view === 'emails' && (
              <input 
                type="text" 
                placeholder="Filter emails..." 
                className="text-xs border rounded-lg px-2 py-1"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
              />
            )}
            {view === 'calendar' && (
              <div className="flex border rounded-lg overflow-hidden text-xs">
                {(['day', 'week', 'month'] as const).map(v => (
                  <button 
                    key={v}
                    onClick={() => setCalendarView(v)}
                    className={`px-3 py-1 capitalize ${calendarView === v ? 'bg-neutral-900 text-white' : 'bg-white hover:bg-neutral-50'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <AnimatePresence>
          {confirmingItem && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-neutral-900"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full space-y-4"
              >
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold">Confirm Your {confirmingItem.type.charAt(0).toUpperCase() + confirmingItem.type.slice(1)}</h3>
                  <p className="text-xs text-neutral-500">Please review the details below</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-2xl space-y-2 text-sm border">
                  {confirmingItem.type === 'flight' && (
                    <>
                      <p className="font-bold">{confirmingItem.data.origin} → {confirmingItem.data.destination}</p>
                      <p className="text-xs text-neutral-500">{confirmingItem.data.airline} • {safeFormat(confirmingItem.data.departureTime, 'MMM d, HH:mm')}</p>
                      <p className="font-bold text-blue-600 mt-2 text-lg">${confirmingItem.data.price}</p>
                      
                      <div className="mt-4 pt-4 border-t border-neutral-100">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={insuranceOptedIn} onChange={(e) => setInsuranceOptedIn(e.target.checked)} className="rounded text-blue-600" />
                          <span className="text-xs font-bold text-neutral-700">Add Travel Insurance</span>
                        </label>
                        {insuranceOptedIn && (
                          <div className="mt-2 text-[10px] text-neutral-600 bg-neutral-50 p-2 rounded-lg">
                            <p>Provider: {insuranceDetails.provider}</p>
                            <p>Policy: {insuranceDetails.policyNumber}</p>
                            <p>Type: {insuranceDetails.type}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {confirmingItem.type === 'hotel' && (
                    <>
                      <p className="font-bold">{confirmingItem.data.name}</p>
                      <p className="text-xs text-neutral-500">{confirmingItem.data.location}</p>
                      <p className="text-xs text-neutral-400">{confirmingItem.data.checkIn} — {confirmingItem.data.checkOut}</p>
                      <p className="font-bold text-orange-600 mt-2 text-lg">${confirmingItem.data.totalPrice}</p>
                      {confirmingItem.data.cancellationPolicy && (
                        <div className="mt-2 pt-2 border-t border-neutral-100 flex gap-2">
                          < Shield size={12} className="text-green-600 mt-0.5 shrink-0" />
                          <p className="text-[10px] text-neutral-500 leading-tight">
                            <span className="font-bold text-neutral-700">Policy:</span> {confirmingItem.data.cancellationPolicy}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  {confirmingItem.type === 'train' || confirmingItem.type === 'bus' ? (
                    <>
                      <p className="font-bold">{confirmingItem.data.origin} → {confirmingItem.data.destination}</p>
                      <p className="text-xs text-neutral-500">{confirmingItem.data.operator} • {confirmingItem.data.departureTime}</p>
                      <p className="font-bold text-neutral-900 mt-2 text-lg">${confirmingItem.data.price}</p>
                    </>
                  ) : confirmingItem.type === 'car' ? (
                    <>
                      <p className="font-bold">{confirmingItem.data.model}</p>
                      <p className="text-xs text-neutral-500">{confirmingItem.data.company} • {confirmingItem.data.location}</p>
                      <p className="font-bold text-neutral-900 mt-2 text-lg">${confirmingItem.data.price}</p>
                    </>
                  ) : confirmingItem.type === 'taxi' ? (
                    <>
                      <p className="font-bold text-neutral-900 mb-4">{confirmingItem.data.origin} → {confirmingItem.data.destination}</p>
                      
                      {confirmingItem.data.driverName ? (
                        <div className="mb-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                          <p className="text-[10px] font-bold text-neutral-400 uppercase">Driver</p>
                          <p className="text-sm font-semibold text-neutral-900">{confirmingItem.data.driverName}</p>
                          <p className="text-xs text-neutral-600">{confirmingItem.data.carModel}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500 mb-2">Premium Taxi Service</p>
                      )}
                      
                      {confirmingItem.data.estimatedArrival && (
                        <div className="mb-2 bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex justify-between items-center">
                           <p className="text-[10px] font-bold text-indigo-500 uppercase">Est. Arrival</p>
                           <p className="text-sm font-bold text-indigo-900">{confirmingItem.data.estimatedArrival}</p>
                        </div>
                      )}

                      <p className="font-bold text-neutral-900 mt-4 text-lg font-black">${confirmingItem.data.price}</p>
                    </>
                  ) : null}

                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase mb-2">Payment Method</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'credit_card', label: 'Credit Card', icon: CreditCardIcon },
                        { id: 'paypal', label: 'PayPal', icon: Smartphone },
                        { id: 'klarna', label: 'Klarna', icon: Zap },
                        { id: 'apple_pay', label: 'Apple Pay', icon: Smartphone }
                      ].map((pkg) => (
                        <button
                          key={pkg.id}
                          onClick={() => setSelectedPayment(pkg.id as PaymentMethod)}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-[10px] font-bold transition-all ${
                            selectedPayment === pkg.id 
                              ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm' 
                              : 'border-neutral-100 bg-neutral-50 text-neutral-600 hover:border-neutral-200'
                          }`}
                        >
                          <pkg.icon size={12} />
                          {pkg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmingItem(null)} className="flex-1 py-3 border border-neutral-200 rounded-2xl font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">Cancel</button>
                  <button onClick={confirmBooking} className="flex-1 py-3 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-transform">Confirm</button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {cancellingItem && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-neutral-900"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full space-y-4"
              >
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold">Cancel Booking?</h3>
                  <p className="text-xs text-neutral-500">Are you sure you want to cancel your flight?</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setCancellingItem(null)} className="flex-1 py-3 border border-neutral-200 rounded-2xl font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">Keep Booking</button>
                  <button onClick={cancelBooking} className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors">Yes, Cancel</button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showPriceAlertForm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-neutral-900"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full space-y-4"
              >
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold">New Price Alert</h3>
                  <p className="text-xs text-neutral-500">We'll notify you when prices drop</p>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-neutral-400 ml-1">Origin</label>
                    <input 
                      type="text" 
                      placeholder="e.g. London" 
                      value={newAlert.origin}
                      onChange={(e) => setNewAlert({...newAlert, origin: e.target.value})}
                      className="w-full bg-neutral-50 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-neutral-400 ml-1">Destination</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Prague" 
                      value={newAlert.destination}
                      onChange={(e) => setNewAlert({...newAlert, destination: e.target.value})}
                      className="w-full bg-neutral-50 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-neutral-400 ml-1">Maximum Price ($)</label>
                    <input 
                      type="number" 
                      value={newAlert.maxPrice}
                      onChange={(e) => setNewAlert({...newAlert, maxPrice: parseInt(e.target.value)})}
                      className="w-full bg-neutral-50 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowPriceAlertForm(false)} className="flex-1 py-3 border border-neutral-200 rounded-2xl font-bold text-neutral-600">Cancel</button>
                  <button onClick={handleAddPriceAlert} className="flex-1 py-3 bg-neutral-900 text-white rounded-2xl font-bold">Set Alert</button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {cancellingItem && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-neutral-900"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl space-y-6"
              >
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle size={32} />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-neutral-900">Cancel Booking?</h3>
                  <p className="text-sm text-neutral-500">
                    Are you sure you want to cancel your {cancellingItem.type === 'flight' ? `flight to ${cancellingItem.data.destination}` : 'booking'}? This may incur fees.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setCancellingItem(null)} className="flex-1 py-3 text-sm font-bold text-neutral-600 bg-neutral-100 rounded-2xl hover:bg-neutral-200">Go Back</button>
                    <button 
                      onClick={async () => {
                        setLoading(true);
                        try {
                          if (cancellingItem.type === 'flight') {
                            await flightService.deleteFlight(cancellingItem.data.id);
                            addMessage({ role: 'assistant', content: `Nexus has cancelled your flight to ${cancellingItem.data.destination}. Refund initiated.` });
                          } else if (cancellingItem.type === 'hotel') {
                            // Assuming hotelService.deleteHotel exists or update status
                            await hotelService.updateHotel(cancellingItem.data.id, { status: 'search_result' }); 
                            addMessage({ role: 'assistant', content: `Your booking at ${cancellingItem.data.name} has been cancelled.` });
                          }
                          setCancellingItem(null);
                          await refreshData();
                        } catch (error) {
                          addMessage({ role: 'assistant', content: 'Cancellation failed.' });
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="flex-1 py-3 text-sm font-bold text-white bg-red-600 rounded-2xl hover:bg-red-700 shadow-lg shadow-red-200"
                    >
                      Confirm
                    </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {viewingBoardingPass && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-900/95 z-50 p-6 flex flex-col items-center justify-center"
            >
              <div className="w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                <div className="bg-blue-600 p-6 text-white space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Plane size={20} />
                      <span className="font-black tracking-tighter text-lg uppercase">Nexus Air</span>
                    </div>
                    <span className="text-xs font-bold opacity-60">Boarding Pass</span>
                  </div>
                  <div className="flex justify-between items-center py-4">
                    <div className="text-left">
                      <p className="text-3xl font-black">{viewingBoardingPass.origin.substring(0, 3).toUpperCase()}</p>
                      <p className="text-[10px] opacity-70 font-bold">{viewingBoardingPass.origin}</p>
                    </div>
                    <ChevronRight className="opacity-30" size={32} />
                    <div className="text-right">
                      <p className="text-3xl font-black">{viewingBoardingPass.destination.substring(0, 3).toUpperCase()}</p>
                      <p className="text-[10px] opacity-70 font-bold">{viewingBoardingPass.destination}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <div>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase">Passenger</p>
                      <p className="font-bold text-sm truncate">{user?.displayName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-neutral-400 font-bold uppercase">Flight No</p>
                      <p className="font-bold text-sm">{viewingBoardingPass.flightNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase">Gate</p>
                      <p className="font-bold text-sm">{viewingBoardingPass.gate || 'B24'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-neutral-400 font-bold uppercase">Seat</p>
                      <p className="font-bold text-sm">12A</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase">Departure</p>
                      <p className="font-bold text-sm">{safeFormat(viewingBoardingPass.departureTime, 'HH:mm')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-neutral-400 font-bold uppercase">Zone</p>
                      <p className="font-bold text-sm">Priority 1</p>
                    </div>
                  </div>

                  <div className="border-t-2 border-dashed border-neutral-100 pt-8 flex flex-col items-center space-y-4">
                    <div className="w-32 h-32 bg-neutral-100 rounded-2xl flex items-center justify-center">
                       {/* Mock QR Code */}
                       <div className="w-24 h-24 grid grid-cols-6 grid-rows-6 gap-0.5">
                         {Array.from({ length: 36 }).map((_, i) => (
                           <div key={i} className={`rounded-sm ${Math.random() > 0.5 ? 'bg-neutral-900' : 'bg-transparent'}`} />
                         ))}
                       </div>
                    </div>
                    <p className="font-mono text-[10px] text-neutral-400 tracking-widest uppercase">NX-BP-2024-55910</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setViewingBoardingPass(null)}
                className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all"
              >
                Done
              </button>
            </motion.div>
          )}

          {reviewingItem && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-neutral-900"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full space-y-4"
              >
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold">Review Your {reviewingItem.type.charAt(0).toUpperCase() + reviewingItem.type.slice(1)}</h3>
                  <p className="text-xs text-neutral-500">How was your experience with {reviewingItem.name}?</p>
                </div>
                
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`p-2 transition-colors ${reviewRating >= star ? 'text-yellow-400' : 'text-neutral-200'}`}
                    >
                      <Star size={24} fill={reviewRating >= star ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>

                <textarea
                  placeholder="Share your experience..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full text-xs p-3 border rounded-xl"
                  rows={3}
                />

                <div className="flex gap-3">
                  <button onClick={() => setReviewingItem(null)} className="flex-1 py-3 border border-neutral-200 rounded-2xl font-bold text-neutral-600">Cancel</button>
                  <button onClick={handleAddReview} className="flex-1 py-3 bg-neutral-900 text-white rounded-2xl font-bold">Submit Review</button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {viewingTicket && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white z-50 p-8 flex flex-col items-center justify-center space-y-8"
              id="printable-ticket"
            >
              <div className="w-full max-w-lg border-4 border-dashed border-neutral-200 p-8 rounded-3xl space-y-6 bg-white shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center border-b-2 border-neutral-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Plane size={24} className="text-blue-600" />
                    <span className="font-black text-xl tracking-tighter uppercase">Boarding Pass</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase">Flight</p>
                    <p className="font-bold text-lg">{viewingTicket.flightNumber || 'NX-402'}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center py-4">
                  <div className="text-left">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase">Origin</p>
                    <p className="text-3xl font-black">{viewingTicket.origin.substring(0, 3).toUpperCase()}</p>
                    <p className="text-xs text-neutral-500 font-medium">{viewingTicket.origin}</p>
                  </div>
                  <motion.div 
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="flex flex-col items-center">
                      <ChevronRight className="text-neutral-300" size={32} />
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        viewingTicket.liveStatus === 'Delayed' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {viewingTicket.liveStatus || 'On Time'}
                      </span>
                    </div>
                  </motion.div>
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase">Destination</p>
                    <p className="text-3xl font-black">{viewingTicket.destination.substring(0, 3).toUpperCase()}</p>
                    <p className="text-xs text-neutral-500 font-medium">{viewingTicket.destination}</p>
                  </div>
                </div>

                {viewingTicket.liveStatus === 'Delayed' && (
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 space-y-1">
                    <div className="flex justify-between items-center text-amber-800">
                      <span className="text-[10px] uppercase font-black flex items-center gap-1"><Clock size={10} /> Estimated Delay</span>
                      <span className="font-bold text-sm">{viewingTicket.delayMinutes || 45} Minutes</span>
                    </div>
                    {viewingTicket.delayReason && <p className="text-[10px] text-amber-600 font-medium italic">{viewingTicket.delayReason}</p>}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 border-t-2 border-neutral-100 pt-6">
                  <div>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase">Gate</p>
                    <p className="font-bold text-blue-600">{viewingTicket.gate || 'B24'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase">Departure</p>
                    <p className="font-bold">{safeFormat(viewingTicket.departureTime, 'HH:mm')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase">Seat</p>
                    <p className="font-bold">12A</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                   <div>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase">Passenger</p>
                    <p className="font-bold text-xs truncate">{user?.displayName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase">Airline</p>
                    <p className="font-bold text-xs">{viewingTicket.airline}</p>
                  </div>
                </div>

                <div className="border-t-2 border-neutral-100 pt-6 flex justify-center">
                  <div className="w-full h-12 bg-[repeating-linear-gradient(90deg,black,black_2px,transparent_2px,transparent_4px)] opacity-50" />
                </div>
                
                <div className="mt-4 pt-4 border-t border-neutral-100">
                  <textarea
                    placeholder="Add a personal note..."
                    value={viewingTicket.personalNote || ''}
                    onChange={(e) => updateFlightNote(viewingTicket.id, e.target.value)}
                    className="w-full text-xs p-2 border rounded-xl"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-4 print:hidden">
                <button onClick={() => setViewingTicket(null)} className="px-6 py-3 border rounded-xl font-bold hover:bg-neutral-50">Close</button>
                <button onClick={() => handleCancelFlight(viewingTicket)} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">Cancel Flight</button>
                <button onClick={() => window.print()} className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800">Print Ticket</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {view !== 'chat' && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => setView('chat')}
              className="fixed bottom-6 right-6 w-14 h-14 bg-neutral-900 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform z-50 group"
            >
              <Sparkles size={24} />
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }} 
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-neutral-900 rounded-full -z-10 blur-md opacity-20"
              />
              <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap bg-neutral-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                ASK NEXUS
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <AnimatePresence mode="wait">
            {view === 'chat' && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-3xl mx-auto flex flex-col h-full"
              >
                <div className="flex-1 space-y-4 mb-4 mt-2">
                  <AnimatePresence mode="popLayout">
                    {alerts.filter(a => !a.isRead).length > 0 && alerts.filter(a => !a.isRead).map(alert => (
                      <ProactiveAlertCard 
                        key={alert.id} 
                        alert={alert} 
                        onDismiss={async () => {
                          await alertService.updateAlert(alert.id, { isRead: true });
                          await refreshData();
                        }} 
                      />
                    ))}
                  </AnimatePresence>

                  {messages.length === 0 && (
                    <div className="text-center py-12 space-y-8">
                      <div className="space-y-2">
                        <h3 className="text-3xl font-black text-neutral-900 tracking-tight">Nex Assistant</h3>
                        <p className="text-neutral-500 text-sm max-w-sm mx-auto">Your elite lifestyle manager. Managing your travel, finance, and career with precision.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                        {suggestedActions.map(action => (
                          <button 
                            key={action.label}
                            onClick={() => sendMessage(action.label)}
                            className="flex items-center gap-3 p-4 bg-white border rounded-2xl hover:border-neutral-900 hover:shadow-md transition-all text-left group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                              {action.icon}
                            </div>
                            <span className="text-sm font-bold text-neutral-700">{action.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}
                    >
                      {m.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center shrink-0 shadow-lg shadow-neutral-200">
                          <Sparkles size={14} className="text-white" />
                        </div>
                      )}
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-neutral-900 text-white rounded-tr-none' : 'bg-white border rounded-tl-none shadow-sm'}`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                        {m.role === 'assistant' && m.content.startsWith('FLIGHT UPDATE:') && !m.acknowledged && (
                          <button
                            onClick={() => {
                              const newMessages = [...messages];
                              newMessages[i].acknowledged = true;
                              setMessages(newMessages);
                            }}
                            className="mt-2 text-xs bg-neutral-900 text-white px-3 py-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="flex justify-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center shrink-0">
                        <Loader2 size={14} className="text-white animate-spin" />
                      </div>
                      <div className="bg-neutral-50 border rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 text-neutral-400">
                        <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="sticky bottom-0 space-y-4">
                  {messages.length > 0 && !loading && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                      {['Check emails', 'Next event', 'Prague flight alerts'].map(p => (
                        <button 
                          key={p}
                          onClick={() => sendMessage(p)}
                          className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider bg-white border px-3 py-1.5 rounded-full hover:bg-neutral-50 transition-colors shadow-sm"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="bg-white/95 backdrop-blur-sm p-4 border rounded-2xl shadow-xl flex gap-2 items-center">
                    <input 
                      type="text" 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                      placeholder="Ask Nexus anything..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
                    />
                    <button 
                      onClick={toggleListening}
                      className={`p-2 rounded-xl transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'}`}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    <button 
                      disabled={loading || !input.trim()}
                      onClick={() => sendMessage(input)}
                      className="p-2 bg-neutral-900 text-white rounded-xl disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'emails' && (
              <motion.div 
                key="emails"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-[calc(100vh-120px)] flex gap-6 max-w-6xl mx-auto"
              >
                {/* Email Sidebar/List */}
                <div className="w-80 flex flex-col bg-white rounded-3xl border shadow-sm overflow-hidden">
                  <div className="p-4 border-b space-y-4 bg-neutral-50/50">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input 
                        type="text" 
                        placeholder="Search mail..." 
                        value={emailFilter}
                        onChange={(e) => setEmailFilter(e.target.value)}
                        className="w-full bg-white text-xs pl-10 pr-4 py-2.5 rounded-xl border border-neutral-100 focus:ring-1 focus:ring-neutral-200 outline-none"
                      />
                    </div>
                    {/* Smart Folders/Tabs */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {(['All', 'Work', 'Personal', 'Promotions'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveEmailTab(tab)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                            activeEmailTab === tab 
                              ? 'bg-neutral-900 text-white shadow-md' 
                              : 'bg-neutral-200/50 text-neutral-500 hover:bg-neutral-200'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    {filteredEmails.length === 0 ? (
                      <div className="p-12 text-center space-y-2 opacity-50">
                        <Mail size={32} className="mx-auto text-neutral-200" />
                        <p className="text-xs font-bold uppercase tracking-widest">Inbox Clean</p>
                      </div>
                    ) : (
                      filteredEmails.map(email => (
                        <button 
                          key={email.id}
                          onClick={() => {
                            setSelectedEmail(email);
                            setShowSummary(false);
                            setEmailSummary(null);
                          }}
                          className={`w-full p-4 border-b text-left transition-all relative ${selectedEmail?.id === email.id ? 'bg-neutral-50' : 'hover:bg-neutral-50/50'}`}
                        >
                          {!email.isRead && (
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          )}
                          <div className="flex justify-between items-start mb-1 ml-2">
                            <span className="text-[9px] text-neutral-400 font-black uppercase tracking-tighter">{email.category}</span>
                            <span className="text-[9px] text-neutral-400 font-medium">{safeFormat(email.timestamp, 'HH:mm')}</span>
                          </div>
                          <div className="ml-2">
                            <p className={`text-xs font-bold truncate ${email.isRead ? 'text-neutral-500' : 'text-neutral-900'}`}>{email.subject}</p>
                            <p className="text-[10px] text-neutral-400 truncate mt-0.5">{email.sender}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Email Content Detail View */}
                <div className="flex-1 bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col">
                  {selectedEmail ? (
                    <div className="flex-1 overflow-y-auto p-10 space-y-8">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h2 className="text-3xl font-black text-neutral-900 tracking-tighter leading-none">{selectedEmail.subject}</h2>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] font-black uppercase">
                              {selectedEmail.sender[0]}
                            </div>
                            <div className="text-xs">
                              <p className="font-bold text-neutral-900">{selectedEmail.sender}</p>
                              <p className="text-[10px] text-neutral-400">{safeFormat(selectedEmail.timestamp, 'PPPP p')}</p>
                            </div>
                          </div>
                        </div>
                        {selectedEmail.content.length > 200 && (
                          <button 
                            onClick={async () => {
                              if (showSummary) {
                                setShowSummary(false);
                                return;
                              }
                              setIsSummarizing(true);
                              setShowSummary(true);
                              const summary = await generateEmailSummary(selectedEmail.content);
                              setEmailSummary(summary);
                              setIsSummarizing(false);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all border border-white/10"
                          >
                            <Sparkles size={14} className="text-blue-400" />
                            {showSummary ? 'Hide breakdown' : '✨ AI Summary'}
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {showSummary && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0, y: -10 }}
                            animate={{ height: 'auto', opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -10 }}
                            className="overflow-hidden"
                          >
                            <div className="p-8 bg-neutral-900 text-white rounded-[2rem] space-y-4 relative overflow-hidden shadow-2xl">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full -mr-16 -mt-16" />
                              <div className="flex items-center gap-2 text-blue-400">
                                <Sparkles size={14} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Nexus Neural Extraction</span>
                              </div>
                              {isSummarizing ? (
                                <div className="flex gap-2 py-4">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                              ) : (
                                <p className="text-sm text-neutral-200 leading-relaxed font-medium italic serif">
                                  "{emailSummary}"
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="text-neutral-700 text-base leading-relaxed whitespace-pre-wrap font-book selection:bg-blue-100 py-6 border-t border-neutral-100 mt-8">
                        {selectedEmail.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6 opacity-30 mt-20">
                      <div className="w-24 h-24 bg-neutral-50 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-neutral-200">
                        <Mail size={48} className="text-neutral-300" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase tracking-widest text-neutral-900">Communication Center</h3>
                        <p className="text-xs font-medium max-w-[240px] mx-auto uppercase tracking-tighter">Select correspondence for nexus to analyze and present.</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'calendar' && (
              <motion.div 
                key="calendar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto"
              >
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-neutral-400 flex items-center gap-2 uppercase tracking-widest">
                    <Clock size={14} /> Upcoming Events
                  </h3>
                  {events.length === 0 ? (
                    <p className="text-neutral-400">No events found.</p>
                  ) : (
                    events.map(event => (
                      <div key={event.id} className="bg-white p-4 rounded-2xl border flex gap-4">
                        <div className="w-12 h-12 bg-neutral-50 rounded-xl flex flex-col items-center justify-center border shrink-0">
                          <span className="text-[10px] text-neutral-400 font-bold uppercase">{safeFormat(event.startTime, 'MMM')}</span>
                          <span className="text-lg font-bold leading-tight">{safeFormat(event.startTime, 'd')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{event.title}</h4>
                          <p className="text-xs text-neutral-500">{safeFormat(event.startTime, 'h:mm a')} - {safeFormat(event.endTime, 'h:mm a')}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6 h-fit sticky top-6">
                  <h3 className="font-bold text-xl">Quick Event</h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-neutral-400">Title</label>
                      <input type="text" placeholder="e.g. Flight to Paris" className="w-full bg-neutral-50 border-none rounded-xl p-3 text-sm" />
                    </div>
                    <button className="w-full bg-neutral-900 text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                      <Plus size={16} /> Schedule with Nexus
                    </button>
                    <p className="text-[10px] text-center text-neutral-400 font-medium">Nexus handles the time booking for you based on current data.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'flights' && (
              <motion.div 
                key="flights"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 max-w-4xl mx-auto"
              >
                {/* Price Alerts Section */}
                {priceAlerts.length > 0 && (
                  <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-4">
                    <h4 className="font-bold flex items-center gap-2 text-blue-900 px-2">
                      <Bell size={18} className="text-blue-600" /> Active Price Alerts
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {priceAlerts.map(alert => (
                        <div key={alert.id} className="bg-white p-4 rounded-2xl border flex items-center justify-between shadow-sm">
                          <div>
                            <p className="font-bold text-sm">{alert.origin} → {alert.destination}</p>
                            <p className="text-[10px] text-neutral-400 font-medium">Alert if price &lt; ${alert.maxPrice}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${alert.status === 'triggered' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            {alert.status === 'triggered' ? 'PRICE DROP!' : 'Active'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="font-bold flex items-center gap-2">
                    <Plane size={18} /> Flight Itineraries
                  </h4>
                  <button 
                    onClick={() => setShowPriceAlertForm(true)}
                    className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all border border-blue-100"
                  >
                    <Bell size={14} /> Create Price Alert
                  </button>
                </div>

                <div className="bg-neutral-50 p-4 rounded-2xl border flex flex-wrap gap-4 items-end">
                  <div className="space-y-2 flex-1 min-w-[150px]">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">From</label>
                    <input 
                      type="text"
                      placeholder="e.g. London"
                      value={flightFilter.origin}
                      onChange={(e) => setFlightFilter({...flightFilter, origin: e.target.value})}
                      className="w-full text-xs px-3 py-2 rounded-lg border focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2 flex-1 min-w-[150px]">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">To</label>
                    <input 
                      type="text"
                      placeholder="e.g. Prague"
                      value={flightFilter.destination}
                      onChange={(e) => setFlightFilter({...flightFilter, destination: e.target.value})}
                      className="w-full text-xs px-3 py-2 rounded-lg border focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Max Stops</label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3].map(s => (
                        <button
                          key={s}
                          onClick={() => setFlightFilter({...flightFilter, maxStops: s})}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${flightFilter.maxStops === s ? 'bg-blue-600 text-white' : 'bg-white border text-neutral-600 hover:bg-neutral-50'}`}
                        >
                          {s === 0 ? 'Non' : s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <div className="flex justify-between">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Departure</label>
                      <span className="text-[10px] font-bold text-blue-600">{flightFilter.departureTimeRange[0]}h - {flightFilter.departureTimeRange[1]}h</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input 
                        type="range" 
                        min="0" 
                        max="24" 
                        value={flightFilter.departureTimeRange[0]}
                        onChange={(e) => setFlightFilter({...flightFilter, departureTimeRange: [parseInt(e.target.value), flightFilter.departureTimeRange[1]]})}
                        className="flex-1 accent-blue-600"
                      />
                      <input 
                        type="range" 
                        min="0" 
                        max="24" 
                        value={flightFilter.departureTimeRange[1]}
                        onChange={(e) => setFlightFilter({...flightFilter, departureTimeRange: [flightFilter.departureTimeRange[0], parseInt(e.target.value)]})}
                        className="flex-1 accent-blue-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <div className="flex justify-between">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Arrival</label>
                      <span className="text-[10px] font-bold text-blue-600">{flightFilter.arrivalTimeRange[0]}h - {flightFilter.arrivalTimeRange[1]}h</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input 
                        type="range" 
                        min="0" 
                        max="24" 
                        value={flightFilter.arrivalTimeRange[0]}
                        onChange={(e) => setFlightFilter({...flightFilter, arrivalTimeRange: [parseInt(e.target.value), flightFilter.arrivalTimeRange[1]]})}
                        className="flex-1 accent-blue-600"
                      />
                      <input 
                        type="range" 
                        min="0" 
                        max="24" 
                        value={flightFilter.arrivalTimeRange[1]}
                        onChange={(e) => setFlightFilter({...flightFilter, arrivalTimeRange: [flightFilter.arrivalTimeRange[0], parseInt(e.target.value)]})}
                        className="flex-1 accent-blue-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Max Price</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" 
                          min="0" 
                          max="2000" 
                          step="50"
                          value={flightFilter.maxPrice}
                          onChange={(e) => setFlightFilter({...flightFilter, maxPrice: parseInt(e.target.value)})}
                          className="w-24 accent-blue-600"
                        />
                        <span className="font-bold text-blue-600 text-xs w-12">${flightFilter.maxPrice}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Airline</label>
                      <select 
                        value={flightFilter.airline}
                        onChange={(e) => setFlightFilter({...flightFilter, airline: e.target.value})}
                        className="text-xs bg-white px-3 py-1.5 rounded-lg border focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="">All Airlines</option>
                        {Array.from(new Set([...ALL_AIRLINES, ...flights.map(f => f.airline)])).sort().map(airline => (
                          <option key={airline} value={airline}>{airline}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                  {filteredFlights.length === 0 ? (
                    <p className="text-center text-neutral-400 py-12">Search for flights in chat to see options here.</p>
                  ) : (
                    filteredFlights.map(flight => (
                      <div key={flight.id} className="group bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow" id={`flight-${flight.id}`}>
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-100">
                            <Plane size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-lg">{flight.origin} → {flight.destination}</h4>
                              <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">
                                <Star size={8} fill="currentColor" /> {getItemRating(flight.id) || 'New'}
                              </div>
                            </div>
                            <p className="text-xs text-neutral-500 font-medium">
                              {flight.airline} • {safeFormat(flight.departureTime, 'MMM d, HH:mm')}
                              {flight.stops !== undefined && (
                                <span className="ml-2 text-neutral-400">• {flight.stops === 0 ? 'Non-stop' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}</span>
                              )}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {flight.status === 'booked' ? (
                                <>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    flight.liveStatus === 'Delayed' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                                  }`}>
                                    {flight.liveStatus || 'On Time'}
                                  </span>
                                  {flight.liveStatus === 'Delayed' && (
                                    <span className="text-[10px] text-amber-700 font-bold">
                                      +{flight.delayMinutes}m delay {flight.delayReason && `• ${flight.delayReason}`}
                                    </span>
                                  )}
                                  {flight.gate && (
                                    <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-bold uppercase">
                                      Gate {flight.gate}
                                    </span>
                                  )}
                                  {flight.hasInsurance && (
                                    <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 border border-green-100">
                                      <Shield size={10} /> Insured
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Available</span>
                              )}
                            </div>
                            {flight.status === 'booked' && (
                              <div className="flex flex-col gap-1 mt-2">
                                {flight.personalNote && (
                                  <p className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-lg inline-block">{flight.personalNote}</p>
                                )}
                                <input
                                  type="text"
                                  placeholder="Add/Update note..."
                                  defaultValue={flight.personalNote || ''}
                                  onBlur={(e) => updateFlightNote(flight.id, e.target.value)}
                                  className="text-[10px] text-neutral-600 font-bold bg-neutral-100 px-2 py-1 rounded-lg w-full max-w-[200px]"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-neutral-400 uppercase">Price</p>
                            <p className="text-xl font-bold text-blue-600">${flight.price}</p>
                          </div>
                            <div className="flex flex-col gap-2">
                              {flight.status === 'booked' ? (
                                <>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => setViewingTicket(flight)}
                                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold hover:scale-105 transition-all"
                                    >
                                      Ticket
                                    </button>
                                    {!flight.isCheckedIn ? (
                                      <button 
                                        onClick={() => handleCheckIn(flight, 'flight')}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-bold hover:scale-105 transition-all flex items-center justify-center gap-1"
                                      >
                                        <ClipboardCheck size={10} /> Check-In
                                      </button>
                                    ) : (
                                      <button 
                                        onClick={() => setViewingBoardingPass(flight)}
                                        className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-xl text-[10px] font-bold hover:scale-105 transition-all"
                                      >
                                        Boarding Pass
                                      </button>
                                    )}
                                  </div>
                                  <button 
                                    onClick={() => setReviewingItem({ id: flight.id, type: 'flight', name: flight.airline })}
                                    className="w-full py-2 border rounded-xl text-[10px] font-bold text-neutral-600 hover:bg-neutral-50 transition-all flex items-center justify-center gap-2"
                                  >
                                    <Star size={10} /> Review Flight
                                  </button>
                                  <button 
                                    onClick={() => handleCancelFlight(flight)}
                                    className="w-full py-2 border border-red-100 text-red-600 rounded-xl text-[10px] font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2 mt-1"
                                  >
                                    <Trash2 size={10} /> Cancel Flight
                                  </button>
                                </>
                              ) : (
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleBookFlight(flight)}
                                    className="px-6 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-all"
                                  >
                                    Book Now
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setNewAlert({ origin: flight.origin, destination: flight.destination, maxPrice: Math.max(50, flight.price - 50), targetType: 'flight' });
                                      setShowPriceAlertForm(true);
                                    }}
                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-1"
                                  >
                                    <Bell size={14} /> Alert
                                  </button>
                                </div>
                              )}
                            </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {view === 'hotels' && (
              <motion.div 
                key="hotels"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 max-w-4xl mx-auto"
              >
                <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="font-bold flex items-center gap-2">
                      <Building2 size={18} /> Available Hotels
                    </h4>
                    <div className="flex gap-4 items-center">
                      <div className="flex items-center gap-2 text-xs">
                        <select 
                          value={hotelFilter.minRating}
                          onChange={(e) => setHotelFilter({...hotelFilter, minRating: parseInt(e.target.value)})}
                          className="bg-neutral-50 px-2 py-1 rounded-lg border-none outline-none focus:ring-1 focus:ring-orange-500"
                        >
                          <option value="0">All Ratings</option>
                          <option value="3">3+ Stars</option>
                          <option value="4">4+ Stars</option>
                          <option value="5">5 Stars</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-neutral-400 font-medium">Max/Night:</span>
                        <input 
                          type="range" 
                          min="0" 
                          max="1000" 
                          step="50"
                          value={hotelFilter.maxPrice}
                          onChange={(e) => setHotelFilter({...hotelFilter, maxPrice: parseInt(e.target.value)})}
                          className="w-20 accent-orange-500"
                        />
                        <span className="font-bold text-orange-600 w-12">${hotelFilter.maxPrice}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 px-2 pb-2">
                    {['WiFi', 'Pool', 'Gym', 'Breakfast', 'Parking', 'Spa', 'Bar', 'Beach Front', 'Free Cancellation', 'Pet-Friendly'].map(amenity => (
                      <button
                        key={amenity}
                        onClick={() => {
                          const newAmenities = hotelFilter.amenities.includes(amenity)
                            ? hotelFilter.amenities.filter(a => a !== amenity)
                            : [...hotelFilter.amenities, amenity];
                          setHotelFilter({ ...hotelFilter, amenities: newAmenities });
                        }}
                        className={`text-[10px] px-3 py-1 rounded-full border transition-all ${
                          hotelFilter.amenities.includes(amenity)
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>

                  {filteredHotels.length === 0 ? (
                    <p className="text-center text-neutral-400 py-12">No hotels matching your criteria. Try searching in chat.</p>
                  ) : (
                    filteredHotels.map(hotel => (
                      <div key={hotel.id} className="group bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-100">
                            <Building2 size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-lg">{hotel.name}</h4>
                              <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">
                                <Star size={8} fill="currentColor" /> {getItemRating(hotel.id) || 'New'}
                              </div>
                            </div>
                            <p className="text-xs text-neutral-500 font-medium">{hotel.location} {hotel.starRating && `• ${hotel.starRating} Stars`}</p>
                            <div className="flex gap-1 mt-1">
                              {hotel.amenities?.slice(0, 3).map(a => (
                                <span key={a} className="text-[9px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-md font-medium uppercase">{a}</span>
                              ))}
                            </div>
                            
                            {/* Reviews Preview */}
                            <div className="mt-2 space-y-1">
                              {reviews.filter(r => r.targetId === hotel.id).slice(0, 2).map((rev) => (
                                <div key={rev.id} className="flex gap-2 items-start opacity-70">
                                  <MessageSquare size={8} className="mt-1 shrink-0 text-neutral-400" />
                                  <p className="text-[9px] text-neutral-500 italic leading-tight line-clamp-1">"{rev.comment}"</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-neutral-400 uppercase">Per Night</p>
                            <p className="text-xl font-bold text-orange-600">${hotel.pricePerNight}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            {hotel.status === 'booked' ? (
                              <>
                                <div className="flex gap-2">
                                   <div className="flex-1 px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-xl text-[10px] font-bold flex items-center justify-center">
                                      Booked
                                   </div>
                                   {!hotel.isCheckedIn ? (
                                      <button 
                                        onClick={() => handleCheckIn(hotel, 'hotel')}
                                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-xl text-[10px] font-bold hover:scale-105 transition-all"
                                      >
                                        Check-In
                                      </button>
                                   ) : (
                                      <div className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-bold flex items-center justify-center">
                                        Checked-In
                                      </div>
                                   )}
                                </div>
                                <button 
                                  onClick={() => setReviewingItem({ id: hotel.id, type: 'hotel', name: hotel.name })}
                                  className="w-full py-2 border rounded-xl text-[10px] font-bold text-neutral-600 hover:bg-neutral-50 transition-all flex items-center justify-center gap-2"
                                >
                                  <Star size={10} /> Review Hotel
                                </button>
                                <button 
                                  onClick={() => setCancellingItem({ type: 'hotel', data: hotel })}
                                  className="w-full py-2 border border-red-100 text-red-600 rounded-xl text-[10px] font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2 mt-1"
                                >
                                  <Trash2 size={10} /> Cancel Hotel
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={() => handleBookHotel(hotel)}
                                className="px-6 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:scale-105 transition-all"
                              >
                                Book Now
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
            {view === 'money' && (
              <motion.div 
                key="money"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 max-w-4xl mx-auto"
              >
                 <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-neutral-900 text-white p-6 rounded-3xl col-span-2 shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-neutral-400 text-xs font-black uppercase tracking-widest">Global Balance</p>
                      <h3 className="text-5xl font-black mt-2 tracking-tighter">
                        ${transactions.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 5000).toLocaleString()}
                      </h3>
                      <div className="mt-10 flex gap-4">
                        <button 
                          onClick={() => {
                            const desc = prompt('Enter description:');
                            const amount = parseFloat(prompt('Enter amount:') || '0');
                            const category = prompt('Enter category (e.g. Food, Travel, Rent):') || 'Other';
                            if (desc && amount) {
                              financialService.addTransaction({
                                description: desc,
                                amount,
                                category,
                                type: 'expense',
                                timestamp: new Date().toISOString()
                              }).then(() => refreshData());
                            }
                          }}
                          className="bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-lg"
                        >
                          Add Expense
                        </button>
                        <button className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Send Money</button>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full -ml-32 -mb-32 blur-3xl opacity-30" />
                  </div>
                  <div className="bg-white border-2 border-neutral-100 p-6 rounded-3xl flex flex-col justify-between shadow-sm">
                    <div>
                      <p className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-4">Spending Velocity</p>
                      <SpendingTrends transactions={transactions} />
                    </div>
                  </div>
                  <div className="bg-white border-2 border-neutral-100 p-6 rounded-3xl flex flex-col justify-between shadow-sm">
                    <div>
                      <p className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-4">Allocation Mix</p>
                      <TransactionChart transactions={transactions} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h4 className="font-bold flex items-center gap-2">
                      <Clock size={16} /> Transaction History
                    </h4>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                      <select 
                        value={`${txSortBy}-${txSortOrder}`} 
                        onChange={(e) => {
                          const [field, order] = e.target.value.split('-') as [any, any];
                          setTxSortBy(field);
                          setTxSortOrder(order);
                        }}
                        className="bg-neutral-50 text-[10px] font-bold px-3 py-1.5 rounded-lg border-none focus:ring-1 focus:ring-neutral-200 outline-none"
                      >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="amount-desc">Amount: High to Low</option>
                        <option value="amount-asc">Amount: Low to High</option>
                      </select>
                      <input 
                        type="date" 
                        value={txFilter.date} 
                        onChange={(e) => setTxFilter({...txFilter, date: e.target.value})}
                        className="bg-neutral-50 text-[10px] font-bold px-3 py-1.5 rounded-lg border-none outline-none"
                      />
                    </div>
                  </div>

                  {/* Filter Chips */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
                    {['all', 'income', 'expense'].map(type => (
                      <button
                        key={type}
                        onClick={() => setTxFilter({...txFilter, type})}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                          txFilter.type === type 
                            ? 'bg-neutral-900 text-white shadow-lg' 
                            : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                    <div className="w-[1px] h-6 bg-neutral-200 mx-1" />
                    {['all', ...Array.from(new Set(transactions.map(t => t.category)))].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setTxFilter({...txFilter, category: cat})}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                          txFilter.category === cat 
                            ? 'bg-neutral-900 text-white shadow-lg' 
                            : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1">
                    {filteredTransactions.length === 0 ? (
                      <p className="text-center text-neutral-400 py-12 italic text-sm">No transactions matching your criteria.</p>
                    ) : (
                      filteredTransactions.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-2xl transition-colors border-b last:border-b-0 border-neutral-50">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {tx.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-neutral-900">{tx.description}</p>
                              <p className="text-[10px] text-neutral-400 font-black uppercase tracking-tight">{tx.category} • {safeFormat(tx.timestamp, 'MMM d, yyyy')}</p>
                            </div>
                          </div>
                          <span className={`font-mono font-bold text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-neutral-900'}`}>
                            {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'shopping' && (
              <motion.div 
                key="shopping"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 max-w-4xl mx-auto"
              >
                {/* Personalized Recommendations - Luxe-Minimalist Style */}
                <div className="bg-[#FAF9F6] p-10 rounded-[3rem] border shadow-sm space-y-10">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black tracking-tighter text-[#1A1A1A] uppercase">Curated For Filip</h2>
                    <div className="w-12 h-1 bg-yellow-600 mx-auto rounded-full" />
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Neural Affinity Score Matching</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {shoppingRecs.length === 0 ? (
                      <p className="text-neutral-400 text-[10px] italic col-span-full py-4 text-center">Identifying high-value matches...</p>
                    ) : (
                      shoppingRecs.map(item => (
                        <div key={item.id} className="group relative">
                          <div className="aspect-[3/4] bg-neutral-100 rounded-3xl overflow-hidden mb-6 relative">
                            <img 
                              src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600'} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" 
                              alt={item.name}
                            />
                            {item.relevanceScore && item.relevanceScore >= 90 && (
                              <div className="absolute top-4 left-4 bg-neutral-900 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                Master Piece
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                          </div>
                          
                          <div className="space-y-1 text-center">
                            <p className="text-yellow-700 text-[10px] font-black uppercase tracking-[0.2em]">{item.brand}</p>
                            <h3 className="font-bold text-neutral-900 tracking-tight">{item.name}</h3>
                            <div className="w-4 h-[1px] bg-neutral-200 mx-auto my-2" />
                            <p className="text-sm font-black text-neutral-900">${item.price.toLocaleString()}</p>
                          </div>

                          <button 
                            onClick={() => sendMessage(`book ${item.brand} ${item.name} from my luxury recommendations`)}
                            className="mt-6 w-full py-4 bg-neutral-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 shadow-xl"
                          >
                            Acquire Item
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { name: "Apple Store Kurfürstendamm", type: "Official Brand", items: [{ name: 'iPhone 15 Pro', price: 999 }, { name: 'MacBook Air M3', price: 1099 }] },
                    { name: "Saturn Alexanderplatz", type: "Mega Store", items: [{ name: 'Samsung S24 Ultra', price: 1199 }, { name: 'OLED TV 55"', price: 1299 }] },
                    { name: "MediaMarkt Alexa", type: "Flagship", items: [{ name: 'RTX 4080 Super', price: 1149 }, { name: 'Switch OLED', price: 349 }] },
                    { name: "Cyberport Friedrichstraße", type: "Specialist", items: [{ name: 'Studio Display', price: 1599 }, { name: 'Keychron Q1', price: 189 }] },
                    { name: "Medimax Prenzlauer Berg", type: "Home Tech", items: [{ name: 'Bosch Dishwasher', price: 549 }, { name: 'Gaming PC', price: 1499 }] },
                    { name: "Notebooksbilliger Leipziger Str.", type: "Specialist", items: [{ name: 'Dell XPS 15', price: 1899 }, { name: 'LG Gram 17', price: 1399 }] }
                  ].map(shop => (
                    <div key={shop.name} className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
                      <div className="flex justify-between items-start px-2">
                        <div>
                          <h4 className="font-bold text-sm text-neutral-900 leading-none">{shop.name}</h4>
                          <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{shop.type}</span>
                        </div>
                        <MoreHorizontal size={14} className="text-neutral-300" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {shop.items.map(item => (
                          <div key={item.name} className="p-3 bg-neutral-50 rounded-2xl border space-y-1 group hover:border-neutral-900 transition-colors">
                            <p className="font-bold text-[10px] truncate">{item.name}</p>
                            <p className="text-blue-600 font-bold text-[10px]">${item.price}</p>
                            <button 
                              onClick={() => sendMessage(`book ${item.name} at ${shop.name}`)}
                              className="w-full py-1 bg-neutral-900 text-white rounded-lg text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity uppercase"
                            >
                              Order
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'cars' && (
              <motion.div 
                key="cars"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 max-w-4xl mx-auto"
              >
                <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="font-bold flex items-center gap-2 text-[#1A1A1A]">
                      <Car size={18} /> Car Rentals
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-neutral-400">MAX PRICE</label>
                        <input 
                          type="range" 
                          min="0" 
                          max="1000" 
                          step="50"
                          value={rentalFilter.maxPrice}
                          onChange={(e) => setRentalFilter({...rentalFilter, maxPrice: parseInt(e.target.value)})}
                          className="w-24 accent-blue-600"
                        />
                        <span className="font-bold text-blue-600 text-[10px] w-8">${rentalFilter.maxPrice}</span>
                      </div>
                      <select 
                        value={rentalFilter.type}
                        onChange={(e) => setRentalFilter({...rentalFilter, type: e.target.value})}
                        className="text-[10px] bg-neutral-50 px-3 py-1.5 rounded-lg border-none focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                      >
                        <option value="">All Types</option>
                        <option value="Luxury">Luxury</option>
                        <option value="SUV">SUV</option>
                        <option value="Sedan">Sedan</option>
                        <option value="Hatchback">Hatchback</option>
                        <option value="Convertible">Convertible</option>
                      </select>
                      <select 
                        value={rentalFilter.transmission}
                        onChange={(e) => setRentalFilter({...rentalFilter, transmission: e.target.value})}
                        className="text-[10px] bg-neutral-50 px-3 py-1.5 rounded-lg border-none focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                      >
                        <option value="">Any Gearbox</option>
                        <option value="Automatic">Automatic</option>
                        <option value="Manual">Manual</option>
                      </select>
                      <select 
                        value={rentalFilter.company}
                        onChange={(e) => setRentalFilter({...rentalFilter, company: e.target.value})}
                        className="text-[10px] bg-neutral-50 px-3 py-1.5 rounded-lg border-none focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                      >
                        <option value="">All Companies</option>
                        {Array.from(new Set(cars.map(c => c.company))).map(co => (
                          <option key={co} value={co}>{co}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2">
                         <label className="text-[10px] font-bold text-neutral-400">MIN MPG</label>
                         <input 
                           type="number" 
                           placeholder="MPG"
                           value={rentalFilter.minFuelEfficiency}
                           onChange={(e) => setRentalFilter({...rentalFilter, minFuelEfficiency: e.target.value})}
                           className="w-16 text-[10px] bg-neutral-50 px-2 py-1.5 rounded-lg border focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                         />
                      </div>
                    </div>
                  </div>

                  {filteredRentals.length === 0 ? (
                    <p className="text-center text-neutral-400 py-12 italic">No rentals found. Ask Nexus to search for cars.</p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {filteredRentals.map(rental => (
                        <div key={rental.id} className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow group">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-neutral-900 text-white rounded-xl flex items-center justify-center font-bold">
                                {rental.company[0]}
                              </div>
                              <div>
                                <h5 className="font-bold text-sm text-[#1A1A1A]">{rental.model}</h5>
                                <p className="text-[10px] text-neutral-400 font-medium">{rental.company} • {rental.location}</p>
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${rental.status === 'booked' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                              {rental.status === 'booked' ? 'Booked' : 'Available'}
                            </div>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-neutral-50 pt-4">
                            <div>
                               <p className="text-[8px] font-bold text-neutral-400 uppercase">Pickup</p>
                               <p className="text-[10px] font-bold">{safeFormat(rental.pickupTime, 'MMM d, HH:mm')}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[8px] font-bold text-neutral-400 uppercase">Return</p>
                               <p className="text-[10px] font-bold">{safeFormat(rental.returnTime, 'MMM d, HH:mm')}</p>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-lg font-bold text-blue-600">${rental.price}</span>
                            {rental.status === 'available' && (
                              <button 
                                onClick={() => handleBookCar(rental)}
                                className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-[10px] font-bold hover:scale-105 transition-all"
                              >
                                Rental Booking
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'vault' && (
              <motion.div 
                key="vault"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 max-w-4xl mx-auto"
              >
                <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-neutral-900 text-white rounded-2xl flex items-center justify-center text-2xl font-bold">FA</div>
                    <div>
                      <h3 className="text-2xl font-bold">Filip Adamek</h3>
                      <p className="text-neutral-500 font-medium">Born: June 22, 1995</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-bold flex items-center gap-2 px-2">
                        <CreditCardIcon size={18} /> Payment Methods
                      </h4>
                      {cards.length === 0 ? (
                        <div className="p-8 bg-neutral-50 rounded-2xl border border-dashed text-center">
                          <p className="text-neutral-400 text-sm">No cards stored.</p>
                        </div>
                      ) : (
                        cards.map(card => (
                          <div key={card.id} className={`${card.type === 'virtual' ? 'bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10' : 'bg-neutral-100 text-neutral-900'} p-6 rounded-2xl shadow-lg relative overflow-hidden group transition-all hover:scale-[1.02]`}>
                             <div className="relative z-10 flex flex-col h-24 justify-between">
                               <div className="flex justify-between items-start">
                                 <div>
                                   <p className={`text-[10px] uppercase tracking-widest ${card.type === 'virtual' ? 'text-neutral-400' : 'text-neutral-500'}`}>{card.brand}</p>
                                   <p className={`text-[8px] font-bold uppercase tracking-tighter ${card.type === 'virtual' ? 'text-blue-400' : 'text-neutral-400'}`}>{card.type || 'Physical'}</p>
                                 </div>
                                 {card.status === 'active' ? (
                                   <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                 ) : (
                                   <span className="w-2 h-2 bg-red-500 rounded-full" />
                                 )}
                               </div>
                               <div className="flex justify-between items-end">
                                 <p className={`text-lg font-mono ${card.type === 'virtual' ? 'text-white' : 'text-neutral-900'}`}>**** **** **** {card.lastFour}</p>
                                 <div className="space-y-1 text-right">
                                   <p className={`text-[8px] uppercase font-black ${card.type === 'virtual' ? 'text-white/30' : 'text-neutral-400'}`}>Exp: {card.expiry}</p>
                                   {card.balance !== undefined && (
                                     <p className="text-xs font-black text-blue-400">${card.balance.toLocaleString()}</p>
                                   )}
                                 </div>
                               </div>
                             </div>
                             
                             <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                               <button 
                                 onClick={async () => {
                                   const newStatus = card.status === 'active' ? 'frozen' : 'active';
                                   await vaultService.updateCard(card.id, { status: newStatus as any });
                                   await refreshData();
                                 }}
                                 className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                               >
                                 {card.status === 'active' ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                               </button>
                               {card.type === 'virtual' && (
                                 <button className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white">
                                   <Smartphone size={12} />
                                 </button>
                               )}
                             </div>

                             <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mb-8 transition-transform group-hover:scale-110" />
                          </div>
                        ))
                      )}
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-bold flex items-center gap-2 px-2">
                        <Building2 size={18} /> Bank Appointments
                      </h4>
                      <p className="text-neutral-400 text-sm px-2">No upcoming bank appointments scheduled.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <h4 className="font-bold flex items-center gap-2">
                        <ClipboardCheck size={18} /> Store Receipts & Pickups
                      </h4>
                      <label className="cursor-pointer bg-neutral-900 text-white px-4 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-2 hover:bg-neutral-800 transition-colors">
                        <Camera size={14} />
                        <span>Scan Receipt</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*,application/pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setLoading(true);
                              // Simulate OCR processing
                              await new Promise(r => setTimeout(r, 2000));
                              const mockReceipt: Omit<Receipt, 'id' | 'userId'> = {
                                itemName: "NVIDIA GeForce RTX 4080 Super",
                                items: [{ name: "RTX 4080 Super", price: 1149 }, { name: "Shipping", price: 50 }],
                                amount: 1199,
                                date: new Date().toISOString(),
                                storeName: "Caseking Store",
                                orderNumber: "CK-" + Math.random().toString(36).substring(7).toUpperCase(),
                                status: 'ready_for_pickup',
                                type: 'electronics',
                                paymentMethod: "Apple Pay (Visa *4421)"
                              };
                              await receiptService.addReceipt(mockReceipt);
                              await refreshData();
                              setLoading(false);
                              addMessage({ role: 'assistant', content: `Nexus Vision has processed your receipt from Caseking. I've added the RTX 4080 Super to your vault.` });
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {receipts.length === 0 ? (
                        <p className="text-neutral-400 text-sm px-2 py-8 italic col-span-full text-center border rounded-2xl bg-neutral-50 border-dashed">No receipts available.</p>
                      ) : (
                        receipts.map(receipt => (
                          <div key={receipt.id} className="p-4 border rounded-2xl bg-white space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-bold text-sm text-neutral-900">{receipt.itemName}</h5>
                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{receipt.storeName}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black text-neutral-900">${receipt.amount}</p>
                                <p className="text-[9px] text-neutral-400">{safeFormat(receipt.date, 'MMM dd, yyyy')}</p>
                              </div>
                            </div>

                            {receipt.items && receipt.items.length > 0 && (
                              <div className="bg-neutral-50 p-2 rounded-xl border border-neutral-100 space-y-1">
                                {receipt.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-[8px] font-medium text-neutral-500">
                                    <span>{item.name}</span>
                                    <span>${item.price}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between pt-2 border-t border-dotted">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${receipt.status === 'ready_for_pickup' ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
                                <div className="space-y-0.5">
                                  <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-tighter leading-none">
                                    {receipt.status.replace('_', ' ')}
                                  </p>
                                  {receipt.paymentMethod && <p className="text-[7px] text-neutral-400 font-bold uppercase">{receipt.paymentMethod}</p>}
                                </div>
                              </div>
                              <p className="text-[9px] font-mono text-neutral-400">#{receipt.orderNumber}</p>
                            </div>

                            {receipt.status === 'ready_for_pickup' && (
                              <button 
                                onClick={async () => {
                                  await receiptService.updateReceipt(receipt.id, { status: 'picked_up' });
                                  await refreshData();
                                  addMessage({ role: 'assistant', content: `Great! You've picked up your ${receipt.itemName} from ${receipt.storeName}.` });
                                }}
                                className="w-full py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold hover:bg-blue-100 transition-colors"
                              >
                                Confirm Pickup
                              </button>
                            )}

                            {receipt.itemName.includes('iPhone') && (
                              <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Smartphone size={80} />
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'agent' && (
              <motion.div 
                key="agent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 max-w-4xl mx-auto"
              >
                <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                    <h4 className="font-bold flex items-center gap-2">
                      <Briefcase size={16} /> Job Search Status
                    </h4>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center bg-neutral-100 rounded-lg px-3 py-1.5 min-w-[150px]">
                        <Search size={14} className="text-neutral-400 mr-2" />
                        <input 
                          type="text" 
                          placeholder="Filter location..." 
                          value={jobFilter.location}
                          onChange={(e) => setJobFilter({...jobFilter, location: e.target.value})}
                          className="bg-transparent text-xs w-full outline-none"
                        />
                      </div>
                      <select 
                        value={jobFilter.status}
                        onChange={(e) => setJobFilter({...jobFilter, status: e.target.value})}
                        className="text-xs bg-neutral-100 px-3 py-2 rounded-lg outline-none"
                      >
                        <option value="all">All Statuses</option>
                        <option value="Applied">Applied</option>
                        <option value="Interviewing">Interviewing</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase">Min Salary</label>
                        <select 
                          value={jobFilter.minSalary}
                          onChange={(e) => setJobFilter({...jobFilter, minSalary: parseInt(e.target.value)})}
                          className="text-xs bg-neutral-100 px-3 py-2 rounded-lg outline-none"
                        >
                          <option value={0}>Any</option>
                          <option value={50000}>$50k+</option>
                          <option value={100000}>$100k+</option>
                          <option value={150000}>$150k+</option>
                          <option value={200000}>$200k+</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {filteredJobs.length === 0 ? (
                    <p className="text-center text-neutral-400 py-8 italic">Ask Nexus to find developer jobs for you.</p>
                  ) : (
                    filteredJobs.map(job => (
                      <div key={job.id} className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-2xl transition-colors border">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                            {job.company[0]}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{job.company}</p>
                            <p className="text-[10px] text-neutral-400 font-medium">{job.role} • {job.salaryRange || 'Open Salary'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <select 
                            value={job.status} 
                            onChange={async (e) => {
                              const newStatus = e.target.value as JobApplication['status'];
                              await jobService.updateJob(job.id, { status: newStatus });
                              await refreshData();
                            }}
                            className="bg-neutral-50 text-[10px] font-bold border-none rounded-lg px-2 py-1 outline-none appearance-none cursor-pointer focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="Applied">Applied</option>
                            <option value="Interviewing">Interviewing</option>
                            <option value="Offer">Offer</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                          <a href={job.link} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-neutral-900 text-white text-[10px] font-bold rounded-lg">View Source</a>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
                   <h4 className="font-bold flex items-center gap-2 px-2">
                    <TrendingUp size={16} /> Luxury Wardrobe
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {shopping.length === 0 ? (
                       <p className="text-center text-neutral-400 py-8 col-span-full">No recommendations saved.</p>
                    ) : (
                      shopping.map(item => (
                        <div key={item.id} className="p-4 border rounded-2xl space-y-2">
                          <p className="font-bold text-xs">{item.brand}</p>
                          <p className="text-neutral-500 text-[10px]">{item.name}</p>
                          <p className="text-blue-600 font-bold text-xs">${item.price}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'travel' && (
              <motion.div 
                key="travel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 max-w-4xl mx-auto"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <h4 className="font-bold flex items-center gap-2">
                        <Train size={16} /> Trains
                      </h4>
                      <button 
                        onClick={() => setAddingTrain(!addingTrain)}
                        className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors"
                      >
                        {addingTrain ? 'Cancel' : '+ Add'}
                      </button>
                    </div>

                    {addingTrain && (
                      <div className="p-4 bg-neutral-50 rounded-2xl border space-y-3">
                        <input type="text" placeholder="Origin" className="w-full text-xs px-3 py-2 rounded-lg border" value={newTrain.origin} onChange={e => setNewTrain({...newTrain, origin: e.target.value})} />
                        <input type="text" placeholder="Destination" className="w-full text-xs px-3 py-2 rounded-lg border" value={newTrain.destination} onChange={e => setNewTrain({...newTrain, destination: e.target.value})} />
                        <input type="text" placeholder="Departure Time (e.g. 14:00)" className="w-full text-xs px-3 py-2 rounded-lg border" value={newTrain.departureTime} onChange={e => setNewTrain({...newTrain, departureTime: e.target.value})} />
                        <input type="text" placeholder="Operator" className="w-full text-xs px-3 py-2 rounded-lg border" value={newTrain.operator} onChange={e => setNewTrain({...newTrain, operator: e.target.value})} />
                        <input type="number" placeholder="Price" className="w-full text-xs px-3 py-2 rounded-lg border" value={newTrain.price || ''} onChange={e => setNewTrain({...newTrain, price: Number(e.target.value)})} />
                        <button 
                          disabled={!newTrain.origin || !newTrain.destination || !newTrain.departureTime || !newTrain.operator}
                          onClick={async () => {
                            setAddingTrain(false);
                            await handleBookTrain({ 
                              ...newTrain, 
                              id: Math.random().toString(), 
                              userId: '', 
                              status: 'available' 
                            } as TrainTicket);
                            setNewTrain({ origin: '', destination: '', departureTime: '', operator: '', price: 0 });
                          }}
                          className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                        >
                          Book Train
                        </button>
                      </div>
                    )}

                    {trains.length === 0 && !addingTrain ? (
                      <p className="text-center text-neutral-400 py-8 italic text-sm">No train bookings tracked.</p>
                    ) : (
                      trains.map(train => (
                        <div key={train.id} className="p-4 border rounded-2xl space-y-2 hover:bg-neutral-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-sm">{train.origin} → {train.destination}</p>
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">{train.status}</span>
                          </div>
                          <p className="text-[10px] text-neutral-400">{train.operator} • {train.departureTime}</p>
                          <p className="text-sm font-bold text-neutral-900">${train.price}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <h4 className="font-bold flex items-center gap-2 text-neutral-900">
                        <Bus size={16} /> Buses
                      </h4>
                      <button 
                        onClick={() => setAddingBus(!addingBus)}
                        className="text-xs bg-neutral-100 text-neutral-600 px-3 py-1.5 rounded-lg font-bold hover:bg-neutral-200 transition-colors"
                      >
                        {addingBus ? 'Cancel' : '+ Add'}
                      </button>
                    </div>

                    {addingBus && (
                      <div className="p-4 bg-neutral-50 rounded-2xl border space-y-3">
                        <input type="text" placeholder="Origin" className="w-full text-xs px-3 py-2 rounded-lg border" value={newBus.origin} onChange={e => setNewBus({...newBus, origin: e.target.value})} />
                        <input type="text" placeholder="Destination" className="w-full text-xs px-3 py-2 rounded-lg border" value={newBus.destination} onChange={e => setNewBus({...newBus, destination: e.target.value})} />
                        <input type="text" placeholder="Departure Time (e.g. 14:00)" className="w-full text-xs px-3 py-2 rounded-lg border" value={newBus.departureTime} onChange={e => setNewBus({...newBus, departureTime: e.target.value})} />
                        <input type="text" placeholder="Operator" className="w-full text-xs px-3 py-2 rounded-lg border" value={newBus.operator} onChange={e => setNewBus({...newBus, operator: e.target.value})} />
                        <input type="number" placeholder="Price" className="w-full text-xs px-3 py-2 rounded-lg border" value={newBus.price || ''} onChange={e => setNewBus({...newBus, price: Number(e.target.value)})} />
                        <button 
                          disabled={!newBus.origin || !newBus.destination || !newBus.departureTime || !newBus.operator}
                          onClick={async () => {
                            setAddingBus(false);
                            await handleBookBus({ 
                              ...newBus, 
                              id: Math.random().toString(), 
                              userId: '', 
                              status: 'available' 
                            } as BusTicket);
                            setNewBus({ origin: '', destination: '', departureTime: '', operator: '', price: 0 });
                          }}
                          className="w-full py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                        >
                          Book Bus
                        </button>
                      </div>
                    )}

                    {buses.length === 0 && !addingBus ? (
                      <p className="text-center text-neutral-400 py-8 italic text-sm">No bus bookings tracked.</p>
                    ) : (
                      buses.map(bus => (
                        <div key={bus.id} className="p-4 border rounded-2xl space-y-2 hover:bg-neutral-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-sm">{bus.origin} → {bus.destination}</p>
                            <span className="text-[10px] bg-neutral-50 text-neutral-500 px-2 py-0.5 rounded-full font-bold uppercase">{bus.status}</span>
                          </div>
                          <p className="text-[10px] text-neutral-400">{bus.operator} • {bus.departureTime}</p>
                          <p className="text-sm font-bold text-neutral-900">${bus.price}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
                    <h4 className="font-bold flex items-center gap-2 px-2 text-neutral-900">
                      <Car size={16} /> Car Rentals
                    </h4>
                    {cars.length === 0 ? (
                      <p className="text-center text-neutral-400 py-8 italic text-sm">No car rentals booked.</p>
                    ) : (
                      cars.map(car => (
                        <div key={car.id} className="p-4 border rounded-2xl space-y-2 hover:bg-neutral-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-sm">{car.model}</p>
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">{car.status}</span>
                          </div>
                          <p className="text-[10px] text-neutral-400">{car.company} • {car.location}</p>
                          <p className="text-xs text-neutral-500">Pickup: {car.pickupTime}</p>
                          <p className="text-sm font-bold text-neutral-900">${car.price}</p>
                          {car.status === 'available' && (
                            <button 
                              onClick={() => handleBookCar(car)}
                              className="w-full mt-2 py-2 bg-neutral-900 text-white rounded-xl text-[10px] font-bold"
                            >
                              Book Now
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <h4 className="font-bold flex items-center gap-2 text-neutral-900">
                        <Navigation2 size={16} /> Taxis & Ride-shares
                      </h4>
                      <button 
                        onClick={() => setShowTaxiResults(!showTaxiResults)}
                        className="text-xs bg-neutral-100 text-neutral-600 px-3 py-1.5 rounded-lg font-bold hover:bg-neutral-200 transition-colors"
                      >
                        {showTaxiResults ? 'Close Search' : 'Search Ride'}
                      </button>
                    </div>

                    {showTaxiResults && (
                      <div className="p-4 bg-neutral-50 rounded-2xl border space-y-3">
                        <div className="space-y-2">
                          <input 
                            type="text" 
                            placeholder="Current Location" 
                            className="w-full text-xs px-3 py-2 rounded-lg border focus:ring-1 focus:ring-blue-500 outline-none" 
                            value={taxiSearch.origin} 
                            onChange={e => setTaxiSearch({...taxiSearch, origin: e.target.value})} 
                          />
                          <input 
                            type="text" 
                            placeholder="Where to?" 
                            className="w-full text-xs px-3 py-2 rounded-lg border focus:ring-1 focus:ring-blue-500 outline-none" 
                            value={taxiSearch.destination} 
                            onChange={e => setTaxiSearch({...taxiSearch, destination: e.target.value})} 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { type: 'Standard', price: 35, time: '4 mins', model: 'Toyota Prius' },
                            { type: 'Luxury', price: 75, time: '6 mins', model: 'Mercedes E-Class' },
                            { type: 'XL', price: 55, time: '8 mins', model: 'VW Sharan' }
                          ].map(opt => (
                            <button
                              key={opt.type}
                              disabled={!taxiSearch.origin || !taxiSearch.destination}
                              onClick={async () => {
                                await handleBookTaxi({
                                  origin: taxiSearch.origin,
                                  destination: taxiSearch.destination,
                                  pickupTime: 'Now',
                                  price: opt.price,
                                  status: 'booked',
                                  driverName: ['Alex', 'Jordan', 'Sam'][Math.floor(Math.random() * 3)],
                                  carModel: opt.model,
                                  estimatedArrival: opt.time
                                } as TaxiBooking);
                                setShowTaxiResults(false);
                              }}
                              className="p-3 border rounded-xl bg-white hover:border-blue-500 transition-all text-left space-y-1 disabled:opacity-50"
                            >
                              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{opt.type}</p>
                              <p className="text-xs font-bold text-neutral-900">${opt.price}</p>
                              <p className="text-[9px] text-neutral-500">{opt.time} away</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {taxis.length === 0 && !showTaxiResults ? (
                      <p className="text-center text-neutral-400 py-8 italic text-sm">No taxi bookings.</p>
                    ) : (
                      taxis.map(taxi => (
                        <div key={taxi.id} className="p-4 border rounded-2xl space-y-3 hover:bg-neutral-50 transition-colors bg-white">
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5">
                              <p className="font-bold text-sm text-neutral-900">{taxi.origin} → {taxi.destination}</p>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  taxi.status === 'completed' ? 'bg-green-100 text-green-600' : 
                                  taxi.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                                  'bg-neutral-100 text-neutral-500'
                                }`}>
                                  {taxi.status.replace('_', ' ')}
                                </span>
                                {taxi.status !== 'completed' && taxi.status !== 'available' && (
                                  <span className="text-[10px] text-neutral-400">• Arriving in {taxi.estimatedArrival}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-neutral-900">${taxi.price}</p>
                              <p className="text-[10px] text-neutral-400 font-medium">{taxi.pickupTime}</p>
                            </div>
                          </div>
                          
                          {taxi.status !== 'available' && taxi.status !== 'completed' && (
                            <div className="space-y-3">
                              {/* Progress bar and status indicators */}
                              <div className="relative pt-1">
                                <div className="flex mb-2 items-center justify-between">
                                  <div>
                                    <span className="text-[8px] font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                      Real-time tracking
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] font-semibold inline-block text-blue-600">
                                      {Math.round((taxi.progress || 0) * 100)}%
                                    </span>
                                  </div>
                                </div>
                                <div className="overflow-hidden h-1.5 mb-2 text-xs flex rounded bg-blue-100">
                                  <motion.div 
                                    style={{ width: `${(taxi.progress || 0) * 100}%` }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                  />
                                </div>
                                <div className="flex justify-between text-[8px] font-bold text-neutral-400 uppercase tracking-tight">
                                  <span className={taxi.status === 'booked' ? 'text-blue-600' : ''}>Booked</span>
                                  <span className={taxi.status === 'arriving' ? 'text-blue-600' : ''}>Arriving</span>
                                  <span className={taxi.status === 'at_pickup' ? 'text-blue-600' : ''}>Pickup</span>
                                  <span className={taxi.status === 'in_progress' ? 'text-blue-600' : ''}>In Route</span>
                                </div>
                              </div>

                              <div className="p-3 bg-neutral-900 rounded-2xl text-white space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/5">
                                      <UserIcon size={14} className="text-white" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold">{taxi.driverName}</p>
                                      <p className="text-[8px] text-white/50 uppercase font-black">{taxi.carModel}</p>
                                    </div>
                                  </div>
                                  <div className="text-right border-l border-white/10 pl-3 px-2 flex flex-col items-center">
                                     <button className="text-[10px] bg-white/10 hover:bg-white/20 p-2 rounded-lg mb-1"><MapIcon size={12}/></button>
                                     <span className="text-[8px] text-white/50 uppercase font-black">Live Map</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {taxi.status === 'completed' && (
                             <div className="p-3 bg-green-50 rounded-xl border border-green-100 flex items-center gap-3">
                               <ThumbsUp size={14} className="text-green-600" />
                               <div>
                                 <p className="text-[10px] font-bold text-green-700">Ride Completed</p>
                                 <p className="text-[8px] text-green-600 font-medium">Payment processed via {selectedPayment.replace('_', ' ')}</p>
                               </div>
                             </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'navigation' && (
              <motion.div 
                key="navigation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-[calc(100vh-200px)] max-w-5xl mx-auto space-y-4"
              >
                {!hasValidMapsKey ? (
                  <div className="bg-white p-12 rounded-3xl border shadow-sm text-center space-y-6">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
                      <MapIcon size={32} />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-2xl font-bold">Maps API Key Required</h3>
                       <p className="text-neutral-500 max-w-sm mx-auto">To enable your navigation center, follow these steps:</p>
                    </div>
                    <div className="text-left bg-neutral-50 p-6 rounded-2xl space-y-4 max-w-md mx-auto">
                      <p className="text-sm"><strong>1. Get a key:</strong> <a href="https://console.cloud.google.com/google/maps-apis/start" target="_blank" rel="noopener" className="text-blue-600 underline">Google Maps Platform</a></p>
                      <p className="text-sm"><strong>2. Add to Secrets:</strong> Settings (⚙️) → Secrets → <code>GOOGLE_MAPS_PLATFORM_KEY</code></p>
                    </div>
                    <p className="text-xs text-neutral-400 italic">The app will rebuild automatically once the key is added.</p>
                  </div>
                ) : (
                  <div className="h-full rounded-3xl overflow-hidden border shadow-sm relative">
                    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
                      <Map
                        defaultCenter={mapCenter}
                        defaultZoom={mapZoom}
                        mapId="DEMO_MAP_ID"
                        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                        className="w-full h-full"
                        onCenterChanged={(ev) => setMapCenter(ev.detail.center)}
                        onZoomChanged={(ev) => setMapZoom(ev.detail.zoom)}
                      >
                        <AdvancedMarker position={mapCenter}>
                           <Pin background="#000" glyphColor="#fff" borderColor="#000" />
                        </AdvancedMarker>
                        {navigationFavs.map(fav => (
                          <AdvancedMarker key={fav.id} position={{ lat: fav.lat, lng: fav.lng }} title={fav.name}>
                            <Pin background="#3b82f6" glyphColor="#fff" />
                          </AdvancedMarker>
                        ))}
                      </Map>
                      <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
                        <div className="flex-1 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl border shadow-2xl flex items-center gap-3">
                          <Search size={16} className="text-neutral-400" />
                          <input 
                            type="text" 
                            placeholder="Find nexus location..." 
                            className="bg-transparent text-sm font-black text-neutral-900 outline-none w-full uppercase tracking-tight"
                          />
                        </div>
                        <button className="bg-white/95 backdrop-blur-md p-3 rounded-2xl border shadow-2xl text-neutral-500 hover:text-neutral-900 transition-colors">
                          <Plus size={20} />
                        </button>
                      </div>

                      <div className="absolute bottom-10 right-10 z-10 flex flex-col gap-3">
                        {selectedPlace && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-white/95 backdrop-blur-md p-6 rounded-[2rem] border shadow-2xl w-72 space-y-4"
                          >
                            <div className="flex justify-between items-start">
                              <h3 className="text-xl font-black text-neutral-900 tracking-tighter uppercase">{selectedPlace.name}</h3>
                              <button onClick={() => setSelectedPlace(null)} className="text-neutral-400 hover:text-neutral-900">
                                <X size={20} />
                              </button>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                                <Sparkles size={10} /> AI Insight
                              </p>
                              <p className="text-xs text-neutral-600 font-medium leading-relaxed">
                                {selectedPlace.description || "Nexus has identified this as a high-value interaction point based on your frequency."}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button className="flex-1 bg-neutral-900 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Get Directions</button>
                              <button className="p-2 border rounded-xl hover:bg-neutral-50"><Share2 size={16} /></button>
                            </div>
                          </motion.div>
                        )}
                        <button 
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition((pos) => {
                                setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                                setMapZoom(15);
                                setSelectedPlace({ name: 'Your Location', description: 'Current coordinates synchronized with nexus.' });
                              });
                            }
                          }}
                          className="self-end bg-neutral-900 text-white p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-110 active:scale-95 transition-all group"
                        >
                          <Locate size={24} />
                        </button>
                      </div>

                      <div className="absolute bottom-8 left-10 z-10 w-full max-w-sm">
                         <div className="bg-white/95 backdrop-blur-md p-3 rounded-3xl border shadow-2xl flex gap-3 overflow-x-auto no-scrollbar">
                           {navigationFavs.map(fav => (
                             <button 
                               key={fav.id}
                               onClick={() => {
                                 setMapCenter({ lat: fav.lat, lng: fav.lng });
                                 setMapZoom(16);
                                 setSelectedPlace(fav);
                               }}
                               className="whitespace-nowrap px-5 py-2.5 bg-neutral-100 text-neutral-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-900 hover:text-white transition-all shadow-sm"
                             >
                               {fav.name}
                             </button>
                           ))}
                         </div>
                      </div>
                    </APIProvider>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
