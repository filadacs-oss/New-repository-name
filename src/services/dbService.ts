import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  doc,
  serverTimestamp,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { categorizeEmail } from './categorizerService';
import { OperationType, Email, CalendarEvent, Flight, Hotel, Transaction, JobApplication, CreditCard, ShoppingItem, TrainTicket, BusTicket, NavigationFavorite, CarRental, TaxiBooking, Review, PriceAlert, Message, TravelAlert, Receipt, UserPreferences } from '../types';

// ... (keep alphabetical or logical order if possible, but let's just add at the end of imports)

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function sortByTimestampDesc<T extends { timestamp?: any }>(items: T[]): T[] {
  return items.sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  });
}

function sortByStartTimeAsc<T extends { startTime?: any }>(items: T[]): T[] {
  return items.sort((a, b) => {
    const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
    const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
    return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
  });
}

export const emailService = {
  async getEmails(): Promise<Email[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(
        collection(db, 'emails'), 
        where('userId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const emails = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Email));
      return sortByTimestampDesc(emails);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'emails');
      return [];
    }
  },
  async createEmail(email: Omit<Email, 'id'>) {
    try {
      const category = await categorizeEmail(email.subject, email.content);
      await addDoc(collection(db, 'emails'), {
        ...email,
        category,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'emails');
    }
  },
  async updateEmail(id: string, data: Partial<Email>) {
    try {
      await updateDoc(doc(db, 'emails', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `emails/${id}`);
    }
  }
};
// ... rest of the file ...
// Need to append the new services at the end.
// First, view the end of the file.


export const calendarService = {
  async getEvents(): Promise<CalendarEvent[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(
        collection(db, 'calendar'), 
        where('userId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
      return sortByStartTimeAsc(events);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'calendar');
      return [];
    }
  },
  async addEvent(event: Omit<CalendarEvent, 'id' | 'userId'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'calendar'), {
        ...event,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'calendar');
    }
  }
};

export const flightService = {
  async getFlights(): Promise<Flight[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(
        collection(db, 'flights'), 
        where('userId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flight));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'flights');
      return [];
    }
  },
  async bookFlight(flight: Omit<Flight, 'id' | 'userId'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'flights'), {
        ...flight,
        userId: auth.currentUser.uid,
        status: 'booked'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'flights');
    }
  },
  async addSearchResult(flight: Omit<Flight, 'id' | 'userId'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'flights'), {
        ...flight,
        userId: auth.currentUser.uid,
        status: 'search_result'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'flights');
    }
  },
  async updateFlight(id: string, data: Partial<Flight>) {
    try {
      await updateDoc(doc(db, 'flights', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `flights/${id}`);
    }
  },
  async deleteFlight(id: string) {
    try {
      await deleteDoc(doc(db, 'flights', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `flights/${id}`);
    }
  },
  async checkIn(id: string): Promise<{ boardingPassUrl: string }> {
    try {
      const boardingPassUrl = `https://nexus.aistudio.com/boarding-pass/${id}`;
      await updateDoc(doc(db, 'flights', id), { 
        isCheckedIn: true, 
        boardingPassUrl,
        gate: ['A1', 'B5', 'C12', 'D2'][Math.floor(Math.random() * 4)] // Simulating gate assignment during check-in
      });
      return { boardingPassUrl };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `flights/${id}`);
      throw error;
    }
  },
  async simulateDelay(id: string): Promise<void> {
    try {
      const delayMinutes = 30 + Math.floor(Math.random() * 90);
      await updateDoc(doc(db, 'flights', id), { 
        liveStatus: 'Delayed',
        delayMinutes: delayMinutes,
        delayReason: 'Air Traffic Control'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `flights/${id}`);
    }
  },
  subscribeToFlightUpdates(userId: string, callback: (flights: Flight[]) => void): () => void {
    const q = query(
      collection(db, 'flights'),
      where('userId', '==', userId)
    );
    return onSnapshot(q, (snapshot) => {
      const flights = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flight));
      callback(flights);
    });
  }
};

export const hotelService = {
  async getHotels(): Promise<Hotel[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, 'hotels'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hotel));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'hotels');
      return [];
    }
  },
  async bookHotel(hotel: Omit<Hotel, 'id' | 'userId'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'hotels'), { ...hotel, userId: auth.currentUser.uid, status: 'booked' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'hotels');
    }
  },
  async addSearchResult(hotel: Omit<Hotel, 'id' | 'userId'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'hotels'), { ...hotel, userId: auth.currentUser.uid, status: 'search_result' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'hotels');
    }
  },
  async deleteHotel(id: string) {
    try {
      await deleteDoc(doc(db, 'hotels', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `hotels/${id}`);
    }
  },
  async updateHotel(id: string, data: Partial<Hotel>) {
    try {
      await updateDoc(doc(db, 'hotels', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `hotels/${id}`);
    }
  },
  async checkIn(id: string): Promise<{ confirmationNumber: string }> {
    try {
      const confirmationNumber = `CONF-${Math.random().toString(36).substring(7).toUpperCase()}`;
      await updateDoc(doc(db, 'hotels', id), { 
        isCheckedIn: true, 
        confirmationNumber 
      });
      return { confirmationNumber };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `hotels/${id}`);
      throw error;
    }
  }
};

export const financialService = {
  async getTransactions(): Promise<Transaction[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, 'transactions'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      return sortByTimestampDesc(txs);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
      return [];
    }
  },
  async addTransaction(tx: Omit<Transaction, 'id' | 'userId'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'transactions'), { ...tx, userId: auth.currentUser.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    }
  }
};

export const jobService = {
  async getJobs(): Promise<JobApplication[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, 'jobs'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobApplication));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'jobs');
      return [];
    }
  },
  async addJob(job: Omit<JobApplication, 'id' | 'userId'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'jobs'), { ...job, userId: auth.currentUser.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'jobs');
    }
  },
  async updateJob(id: string, data: Partial<JobApplication>) {
    try {
      await updateDoc(doc(db, 'jobs', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `jobs/${id}`);
    }
  }
};

export const vaultService = {
  async getCards(): Promise<CreditCard[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, 'cards'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CreditCard));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'cards');
      return [];
    }
  },
  async addCard(card: Omit<CreditCard, 'id' | 'userId'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'cards'), { ...card, userId: auth.currentUser.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'cards');
    }
  },
  async updateCard(id: string, data: Partial<CreditCard>) {
    try {
      await updateDoc(doc(db, 'cards', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `cards/${id}`);
    }
  }
};

export const shoppingService = {
  async getItems(): Promise<ShoppingItem[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, 'shopping'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShoppingItem));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'shopping');
      return [];
    }
  },
  async addItem(item: Omit<ShoppingItem, 'id' | 'userId'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'shopping'), { ...item, userId: auth.currentUser.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'shopping');
    }
  },
  async getRecommendations(): Promise<ShoppingItem[]> {
    // Mock recommendations for now, in a real app this would use ML or past purchases
    return [
      { id: 'rec-iphone', userId: 'system', name: 'iPhone 15 Pro', brand: 'Apple', price: 999, link: '#', image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=400' },
      { id: 'rec-macbook', userId: 'system', name: 'MacBook Air M3', brand: 'Apple', price: 1099, link: '#', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400' },
      { id: 'rec-headphones', userId: 'system', name: 'Sony WH-1000XM5', brand: 'Sony', price: 349, link: '#', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400' },
      { id: 'rec-tv', userId: 'system', name: 'OLED TV 55"', brand: 'LG', price: 1299, link: '#', image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=400' },
      { id: 'rec-gaming', userId: 'system', name: 'GeForce RTX 4080', brand: 'NVIDIA', price: 1199, link: '#', image: 'https://images.unsplash.com/photo-1587202372775-e2200fce9d33?auto=format&fit=crop&q=80&w=400' }
    ];
  }
};

export const trainService = {
  async getTickets(): Promise<TrainTicket[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, 'trains'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainTicket));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'trains');
      return [];
    }
  },
  async addTicket(ticket: Omit<TrainTicket, 'id' | 'userId'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'trains'), { ...ticket, userId: auth.currentUser.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'trains');
    }
  },
  async updateTicket(id: string, data: Partial<TrainTicket>) {
    try {
      await updateDoc(doc(db, 'trains', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `trains/${id}`);
    }
  },
  async deleteTicket(id: string) {
    try {
      await deleteDoc(doc(db, 'trains', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `trains/${id}`);
    }
  }
};

export const busService = {
  async getTickets(): Promise<BusTicket[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, 'buses'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BusTicket));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'buses');
      return [];
    }
  },
  async addTicket(ticket: Omit<BusTicket, 'id' | 'userId'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'buses'), { ...ticket, userId: auth.currentUser.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'buses');
    }
  },
  async updateTicket(id: string, data: Partial<BusTicket>) {
    try {
      await updateDoc(doc(db, 'buses', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `buses/${id}`);
    }
  },
  async deleteTicket(id: string) {
    try {
      await deleteDoc(doc(db, 'buses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `buses/${id}`);
    }
  }
};

export const navigationService = {
  async getFavorites(): Promise<NavigationFavorite[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, 'navigation'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NavigationFavorite));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'navigation');
      return [];
    }
  },
  async addFavorite(fav: Omit<NavigationFavorite, 'id' | 'userId'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'navigation'), { ...fav, userId: auth.currentUser.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'navigation');
    }
  }
};

export const carRentalService = {
  async getRentals(): Promise<CarRental[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, 'cars'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CarRental));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'cars');
      return [];
    }
  },
  async addRental(rental: Omit<CarRental, 'id' | 'userId'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'cars'), { ...rental, userId: auth.currentUser.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'cars');
    }
  },
  async bookRental(rental: Omit<CarRental, 'id' | 'userId'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'cars'), { ...rental, userId: auth.currentUser.uid, status: 'booked' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'cars');
    }
  },
  async updateRental(id: string, data: Partial<CarRental>) {
    try {
      await updateDoc(doc(db, 'cars', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `cars/${id}`);
    }
  }
};


export const taxiService = {
  async getBookings(): Promise<TaxiBooking[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, 'taxis'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaxiBooking));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'taxis');
      return [];
    }
  },
  async bookTaxi(booking: Omit<TaxiBooking, 'id' | 'userId'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'taxis'), { ...booking, userId: auth.currentUser.uid, status: 'booked' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'taxis');
    }
  },
  async addSearchResult(taxi: Omit<TaxiBooking, 'id' | 'userId'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'taxis'), { ...taxi, userId: auth.currentUser.uid, status: 'available' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'taxis');
    }
  },
  async updateTaxi(id: string, data: Partial<TaxiBooking>) {
    try {
      await updateDoc(doc(db, 'taxis', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `taxis/${id}`);
    }
  }
};

export const reviewService = {
  async addReview(review: Omit<Review, 'id' | 'userId' | 'timestamp'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'reviews'), { ...review, userId: auth.currentUser.uid, timestamp: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
    }
  },
  async getReviews(targetId: string): Promise<Review[]> {
    try {
      const q = query(collection(db, 'reviews'), where('targetId', '==', targetId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
      return [];
    }
  },
  async getTargetReviews(targetType: 'flight' | 'hotel'): Promise<Review[]> {
    try {
      const q = query(collection(db, 'reviews'), where('targetType', '==', targetType));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
      return [];
    }
  }
};

export const priceAlertService = {
  async addAlert(alert: Omit<PriceAlert, 'id' | 'userId'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'priceAlerts'), { ...alert, userId: auth.currentUser.uid, status: 'active' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'priceAlerts');
    }
  },
  async getAlerts(): Promise<PriceAlert[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, 'priceAlerts'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PriceAlert));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'priceAlerts');
      return [];
    }
  },
  async updateAlert(id: string, data: Partial<PriceAlert>) {
    try {
      await updateDoc(doc(db, 'priceAlerts', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `priceAlerts/${id}`);
    }
  }
};

export const purchaseService = {
  async bookElectronics(shop: string, model: string, price: number): Promise<{ success: boolean }> {
    if (!auth.currentUser) throw new Error("Not authenticated");
    
    // 1. Create Transaction
    await addDoc(collection(db, 'transactions'), {
      userId: auth.currentUser.uid,
      amount: price,
      category: 'Shopping',
      description: `Purchase ${model} from ${shop}`,
      type: 'expense',
      timestamp: serverTimestamp()
    });
    
    // 2. Create Confirmation Email
    await addDoc(collection(db, 'emails'), {
      userId: auth.currentUser.uid,
      subject: `Order Confirmation: ${model}`,
      content: `Dear Filip Adamek, your order for ${model} from ${shop} for ${price} is confirmed and will be delivered today.`,
      sender: `${shop} Support`,
      timestamp: serverTimestamp(),
      isRead: false,
      category: 'Promotions'
    });
    
    return { success: true };
  },
  async addPurchaseHistory(purchases: Omit<Transaction, 'id' | 'userId'>[]) {
    if (!auth.currentUser) return;
    try {
      const batchPromises = purchases.map(purchase => 
        addDoc(collection(db, 'transactions'), { ...purchase, userId: auth.currentUser!.uid })
      );
      await Promise.all(batchPromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    }
  }
};

export const alertService = {
  async getAlerts(): Promise<TravelAlert[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(
        collection(db, 'travelAlerts'),
        where('userId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TravelAlert));
      return sortByTimestampDesc(alerts);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'travelAlerts');
      return [];
    }
  },
  async addAlert(alert: Omit<TravelAlert, 'id' | 'userId' | 'timestamp' | 'isRead'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'travelAlerts'), {
        ...alert,
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        isRead: false
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'travelAlerts');
    }
  },
  async markAsRead(id: string) {
    try {
      await updateDoc(doc(db, 'travelAlerts', id), { isRead: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `travelAlerts/${id}`);
    }
  }
};

export const chatService = {
  async getMessages(): Promise<Message[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(
        collection(db, 'chats'),
        where('userId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          role: data.role,
          content: data.content,
          type: data.type,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp
        } as Message;
      });
      return sortByTimestampDesc(msgs).reverse(); // Oldest first for chat
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'chats');
      return [];
    }
  },
  async saveMessage(message: Omit<Message, 'timestamp'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'chats'), {
        ...message,
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chats');
    }
  },
  async clearChat() {
    if (!auth.currentUser) return;
    try {
      const q = query(collection(db, 'chats'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'chats');
    }
  }
};

export const preferencesService = {
  async getPreferences(): Promise<UserPreferences | null> {
    if (!auth.currentUser) return null;
    try {
      const q = query(collection(db, 'preferences'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UserPreferences;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'preferences');
      return null;
    }
  },
  async updatePreferences(data: Partial<UserPreferences>) {
    if (!auth.currentUser) return;
    try {
      const q = query(collection(db, 'preferences'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        await addDoc(collection(db, 'preferences'), { ...data, userId: auth.currentUser.uid });
      } else {
        await updateDoc(doc(db, 'preferences', snapshot.docs[0].id), data);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'preferences');
    }
  }
};

export const receiptService = {

  async getReceipts(): Promise<Receipt[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, 'receipts'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Receipt));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'receipts');
      return [];
    }
  },
  async addReceipt(receipt: Omit<Receipt, 'id' | 'userId'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'receipts'), { ...receipt, userId: auth.currentUser.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'receipts');
    }
  },
  async updateReceipt(id: string, data: Partial<Receipt>) {
    try {
      await updateDoc(doc(db, 'receipts', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `receipts/${id}`);
    }
  }
};

