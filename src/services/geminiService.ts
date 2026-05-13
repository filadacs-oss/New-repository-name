import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { emailService, calendarService, flightService, hotelService, financialService, vaultService, jobService, shoppingService, trainService, busService, navigationService, carRentalService, taxiService, reviewService, priceAlertService, purchaseService, alertService, preferencesService, receiptService } from "./dbService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

const listEmailsTool: FunctionDeclaration = {
  name: "list_emails",
  description: "Get the user's recent emails including subjects and snippets.",
  parameters: { type: Type.OBJECT, properties: {} }
};

const summarizeEmailTool: FunctionDeclaration = {
  name: "summarize_email",
  description: "Provide a concise summary of a specific email's content.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      emailId: { type: Type.STRING, description: "The ID of the email to summarize." }
    },
    required: ["emailId"]
  }
};

const listCalendarEventsTool: FunctionDeclaration = {
  name: "list_calendar_events",
  description: "Get the user's upcoming calendar events.",
  parameters: { type: Type.OBJECT, properties: {} }
};

const addCalendarEventTool: FunctionDeclaration = {
  name: "add_calendar_event",
  description: "Add a new event to the user's calendar.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      startTime: { type: Type.STRING, description: "ISO date-time string" },
      endTime: { type: Type.STRING, description: "ISO date-time string" },
      location: { type: Type.STRING },
      description: { type: Type.STRING }
    },
    required: ["title", "startTime", "endTime"]
  }
};

const cancelFlightTool: FunctionDeclaration = {
  name: "cancel_flight",
  description: "Cancel a booked flight.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      flightId: { type: Type.STRING, description: "The ID of the flight to cancel." }
    },
    required: ["flightId"]
  }
};

const searchFlightsTool: FunctionDeclaration = {
  name: "search_flights",
  description: "Search for available flights based on origin(s), destination(s), dates, airlines, stops, and time windows.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      origins: { type: Type.ARRAY, items: { type: Type.STRING } },
      destinations: { type: Type.ARRAY, items: { type: Type.STRING } },
      dates: { type: Type.ARRAY, items: { type: Type.STRING } },
      airline: { type: Type.STRING },
      maxStops: { type: Type.NUMBER },
      departureTimeWindow: { type: Type.STRING }
    },
    required: ["origins", "destinations", "dates"]
  }
};

const bookFlightTool: FunctionDeclaration = {
  name: "book_flight",
  description: "Confirm a flight booking.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      flightDetails: {
        type: Type.OBJECT,
        properties: {
          origin: { type: Type.STRING },
          destination: { type: Type.STRING },
          departureTime: { type: Type.STRING },
          arrivalTime: { type: Type.STRING },
          airline: { type: Type.STRING },
          price: { type: Type.NUMBER },
          hasInsurance: { type: Type.BOOLEAN },
          insuranceDetails: {
            type: Type.OBJECT,
            properties: {
              provider: { type: Type.STRING },
              policyNumber: { type: Type.STRING },
              type: { type: Type.STRING }
            }
          }
        },
        required: ["origin", "destination", "departureTime", "airline", "price"]
      }
    },
    required: ["flightDetails"]
  }
};

const searchHotelsTool: FunctionDeclaration = {
  name: "search_hotels",
  description: "Search for hotels in a specific location with optional filters.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: { type: Type.STRING },
      checkIn: { type: Type.STRING },
      checkOut: { type: Type.STRING },
      starRating: { type: Type.NUMBER },
      minPrice: { type: Type.NUMBER },
      maxPrice: { type: Type.NUMBER },
      amenities: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["location", "checkIn", "checkOut"]
  }
};

const bookHotelTool: FunctionDeclaration = {
  name: "book_hotel",
  description: "Confirm a hotel booking.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      hotelDetails: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          location: { type: Type.STRING },
          checkIn: { type: Type.STRING },
          checkOut: { type: Type.STRING },
          totalPrice: { type: Type.NUMBER }
        },
        required: ["name", "location", "checkIn", "checkOut", "totalPrice"]
      }
    },
    required: ["hotelDetails"]
  }
};

const addHotelTool: FunctionDeclaration = {
  name: "add_hotel",
  description: "Add a hotel entry to the user's available search results.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      location: { type: Type.STRING },
      pricePerNight: { type: Type.NUMBER },
      starRating: { type: Type.NUMBER },
      amenities: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["name", "location", "pricePerNight"]
  }
};

const addMultipleHotelsTool: FunctionDeclaration = {
  name: "add_multiple_hotels",
  description: "Add multiple hotel entries to the user's available search results.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      hotels: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            location: { type: Type.STRING },
            pricePerNight: { type: Type.NUMBER },
            starRating: { type: Type.NUMBER },
            amenities: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "location", "pricePerNight"]
        }
      }
    },
    required: ["hotels"]
  }
};

const getFinancialOverviewTool: FunctionDeclaration = {
  name: "get_financial_overview",
  description: "Get current balance and recent transactions.",
  parameters: { type: Type.OBJECT, properties: {} }
};

const searchJobsTool: FunctionDeclaration = {
  name: "search_jobs",
  description: "Search for developer jobs matching specific criteria.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      role: { type: Type.STRING },
      location: { type: Type.STRING },
      minSalary: { type: Type.STRING }
    }
  }
};

const bookElectronicsTool: FunctionDeclaration = {
  name: "book_electronics",
  description: "Book a phone or laptop for purchase from Apple, Media Markt, or Saturn.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      shop: { type: Type.STRING, enum: ["Apple", "Media Markt", "Saturn"] },
      model: { type: Type.STRING },
      price: { type: Type.NUMBER }
    },
    required: ["shop", "model", "price"]
  }
};

const getLuxuryShoppingTool: FunctionDeclaration = {
  name: "get_luxury_shopping_recs",
  description: "Get luxury shopping recommendations for brands, styles, and electronics shops like Apple, Media Markt, and Saturn.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING },
      minPrice: { type: Type.NUMBER }
    }
  }
};

const saveCardToVaultTool: FunctionDeclaration = {
  name: "save_card_to_vault",
  description: "Save a credit card to the secure vault (demo only).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      brand: { type: Type.STRING },
      lastFour: { type: Type.STRING },
      expiry: { type: Type.STRING }
    },
    required: ["brand", "lastFour", "expiry"]
  }
};

const searchTrainsTool: FunctionDeclaration = {
  name: "search_trains",
  description: "Search for train tickets between locations.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      origin: { type: Type.STRING },
      destination: { type: Type.STRING },
      date: { type: Type.STRING }
    },
    required: ["origin", "destination"]
  }
};

const searchBusesTool: FunctionDeclaration = {
  name: "search_buses",
  description: "Search for bus tickets between locations.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      origin: { type: Type.STRING },
      destination: { type: Type.STRING },
      date: { type: Type.STRING }
    },
    required: ["origin", "destination"]
  }
};

const navigateToTool: FunctionDeclaration = {
  name: "navigate_to",
  description: "Open the navigation center for a specific destination.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      destination: { type: Type.STRING }
    },
    required: ["destination"]
  }
};

const searchCarsTool: FunctionDeclaration = {
  name: "search_cars",
  description: "Search for car rentals in a specific location with advanced filters.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: { type: Type.STRING },
      pickupDate: { type: Type.STRING },
      returnDate: { type: Type.STRING },
      carType: { type: Type.STRING, enum: ["SUV", "Sedan", "Hatchback", "Luxury", "Convertible"] },
      transmission: { type: Type.STRING, enum: ["Automatic", "Manual"] },
      minFuelEfficiency: { type: Type.STRING, description: "e.g. '30 MPG'" }
    },
    required: ["location"]
  }
};

const getTravelAlertsTool: FunctionDeclaration = {
  name: "get_travel_alerts",
  description: "Check for proactive travel alerts (delays, gate changes, traffic) for Filip's booked trips.",
  parameters: { type: Type.OBJECT, properties: {} }
};

const bookCarTool: FunctionDeclaration = {
  name: "book_car",
  description: "Confirm a car rental booking.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      carDetails: {
        type: Type.OBJECT,
        properties: {
          company: { type: Type.STRING },
          model: { type: Type.STRING },
          location: { type: Type.STRING },
          pickupTime: { type: Type.STRING },
          returnTime: { type: Type.STRING },
          price: { type: Type.NUMBER }
        },
        required: ["company", "model", "location", "pickupTime", "returnTime", "price"]
      }
    },
    required: ["carDetails"]
  }
};

const bookTaxiTool: FunctionDeclaration = {
  name: "book_taxi",
  description: "Book a taxi from origin to destination.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      origin: { type: Type.STRING },
      destination: { type: Type.STRING },
      time: { type: Type.STRING }
    },
    required: ["origin", "destination"]
  }
};

const searchTaxisTool: FunctionDeclaration = {
  name: "search_taxis",
  description: "Search for available taxis or ride-shares from origin to destination.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      origin: { type: Type.STRING },
      destination: { type: Type.STRING }
    },
    required: ["origin", "destination"]
  }
};

const getFlightStatusTool: FunctionDeclaration = {
  name: "get_flight_status",
  description: "Check the live status of a booked flight.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      flightNumber: { type: Type.STRING }
    },
    required: ["flightNumber"]
  }
};

const addReviewTool: FunctionDeclaration = {
  name: "add_review",
  description: "Leave a review for a booked flight or hotel.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      targetId: { type: Type.STRING },
      targetType: { type: Type.STRING, enum: ["flight", "hotel"] },
      targetName: { type: Type.STRING },
      rating: { type: Type.NUMBER },
      comment: { type: Type.STRING }
    },
    required: ["targetId", "targetType", "targetName", "rating", "comment"]
  }
};

const addPriceAlertTool: FunctionDeclaration = {
  name: "add_price_alert",
  description: "Set a price alert for a specific flight route or hotel.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      origin: { type: Type.STRING, description: "Only for flights" },
      destination: { type: Type.STRING, description: "Route destination or Hotel name/city" },
      targetType: { type: Type.STRING, enum: ["flight", "hotel"] },
      maxPrice: { type: Type.NUMBER }
    },
    required: ["destination", "targetType", "maxPrice"]
  }
};

const checkInTool: FunctionDeclaration = {
  name: "check_in",
  description: "Perform check-in for a booked flight or hotel.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      bookingId: { type: Type.STRING, description: "The ID of the flight or hotel booking." },
      type: { type: Type.STRING, enum: ["flight", "hotel"] }
    },
    required: ["bookingId", "type"]
  }
};

const listReceiptsTool: FunctionDeclaration = {
  name: "list_receipts",
  description: "List all digital receipts, orders, and purchase records.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      filter: { type: Type.STRING, description: "Optional filter for store name or item name" }
    }
  }
};

const searchTransactionsTool: FunctionDeclaration = {
  name: "search_transactions",
  description: "Search and filter financial transactions.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ["income", "expense"], description: "Filter by income or expense" },
      category: { type: Type.STRING, description: "Filter by category (e.g., Food, Salary, Travel)" },
      startDate: { type: Type.STRING, description: "Filter by start date (ISO string)" },
      endDate: { type: Type.STRING, description: "Filter by end date (ISO string)" },
      sortBy: { type: Type.STRING, enum: ["date", "amount", "description"], description: "Field to sort by" },
      sortOrder: { type: Type.STRING, enum: ["asc", "desc"], description: "Sort order" }
    }
  }
};

const searchEmailsTool: FunctionDeclaration = {
  name: "search_emails",
  description: "Search and filter emails by sender, subject, or category.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      sender: { type: Type.STRING, description: "Filter by sender name or email" },
      subject: { type: Type.STRING, description: "Filter by keywords in subject" },
      category: { type: Type.STRING, enum: ["Work", "Personal", "Promotions", "Social", "Other"], description: "Filter by category" }
    }
  }
};

const checkProactiveAlertsTool: FunctionDeclaration = {
  name: "check_proactive_alerts",
  description: "Manually trigger a check for proactive travel alerts (delays, gate changes).",
  parameters: {
    type: Type.OBJECT,
    properties: {}
  }
};

const getLuxuryRecommendationsTool: FunctionDeclaration = {
  name: "get_luxury_recommendations",
  description: "Get personalized luxury shopping recommendations based on preferences.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      preferences: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of preferred categories or keywords" }
    }
  }
};

const searchNavigationFavoritesTool: FunctionDeclaration = {
  name: "search_navigation_favorites",
  description: "Search user's favorite locations by name or address.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "Name or address keyword to search for" }
    },
    required: ["query"]
  }
};

const savePreferencesTool: FunctionDeclaration = {
  name: "save_flight_preferences",
  description: "Saves user preferences for flights, such as seat type, preferred airline, and loyalty number.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      seatType: { type: Type.STRING, description: "Preferred seat type (e.g., aisle, window)" },
      airline: { type: Type.STRING, description: "Preferred airline" },
      loyaltyNumber: { type: Type.STRING, description: "Airline loyalty number" }
    }
  }
};

const tools = [{
  functionDeclarations: [
    listEmailsTool,
    summarizeEmailTool,
    listCalendarEventsTool,
    addCalendarEventTool,
    searchFlightsTool,
    cancelFlightTool,
    bookFlightTool,
    searchHotelsTool,
    bookHotelTool,
    addHotelTool,
    addMultipleHotelsTool,
    getFinancialOverviewTool,
    searchJobsTool,
    getLuxuryShoppingTool,
    bookElectronicsTool,
    saveCardToVaultTool,
    searchTrainsTool,
    searchBusesTool,
    navigateToTool,
    searchCarsTool,
    bookCarTool,
    searchTaxisTool,
    bookTaxiTool,
    getFlightStatusTool,
    getTravelAlertsTool,
    addReviewTool,
    addPriceAlertTool,
    checkInTool,
    savePreferencesTool,
    listReceiptsTool,
    searchTransactionsTool,
    searchEmailsTool,
    checkProactiveAlertsTool,
    getLuxuryRecommendationsTool,
    searchNavigationFavoritesTool
  ]
}];

export async function processAssistantRequest(prompt: string, history: any[]) {
  const model = "gemini-3-flash-preview";
  
  // Prepare contents with tools
  let contents = [...history, { role: 'user', parts: [{ text: prompt }] }];
  
  // Fetch calendar context to inform the AI about appointments
  const calendarData = await calendarService.getEvents();
  const calendarContext = calendarData.length > 0 
    ? `\n\nUPCOMING CALENDAR FOR FILIP:\n${calendarData.map(e => `- ${e.title} in ${e.location} from ${e.startTime} to ${e.endTime}`).join('\n')}`
    : "\n\nFilip has no upcoming calendar events.";

  const preferencesData = await preferencesService.getPreferences();
  const preferencesContext = preferencesData && preferencesData.flightPreferences
    ? `\n\nFLIGHT PREFERENCES:\n- Seat Type: ${preferencesData.flightPreferences.seatType || 'N/A'}\n- Airline: ${preferencesData.flightPreferences.airline || 'N/A'}\n- Loyalty Number: ${preferencesData.flightPreferences.loyaltyNumber || 'N/A'}\n(Prioritize these preferences when searching and booking flights if possible).`
    : "";

  const systemInstruction = `You are Nexus, THE EXCLUSIVE PREMIER PERSONAL AGENT for Filip Adamek (born 22nd June 1995). 

YOUR PERSONAS:
1. AS PUBLICIST: Filip's voice to the world. Manage brand and reputation.
2. AS TALENT AGENT: Find high-paying developer jobs. Negotiate on Filip's behalf.
3. AS FINANCIAL ADVISOR & MANAGER: Oversee money, bank appointments, and budget. 
4. AS LUXURY STYLIST: Recommend elite clothing brands and styles.
5. AS LIFESTYLE MANAGER: Book flights, hotels, trains, buses, car rentals, and taxis. ALWAYS show a summary for approval first.
6. AS NAVIGATION CENTER: Help Filip navigate to any location.
7. AS PROACTIVE TRAVEL MONITOR: Constantly check for flight delays, gate changes, and traffic for booked trips.

DYNAMIC CONTEXT:${calendarContext}${preferencesContext}

LIFESTYLE MANAGEMENT PROCEDURES:
- When booking a flight, ALWAYS cross-check with the calendar events above. If a meeting or deadline is in another city, prioritize suggestions for that city.
- TRAVEL INSURANCE: When a user books a flight, ALWAYS ask if they want to add travel insurance. If they agree, you can use the book_flight tool again or just include the insuranceDetails if provided.
- PROACTIVE ALERTS: You should check for travel alerts using get_travel_alerts tool. If an alert is found, inform Filip immediately.
- PAYMENT OPTIONS: When a user is ready to book, present payment options: Credit Card, PayPal, or Klarna (Buy Now Pay Later).
- REVIEWS: When Filip asks about a hotel or flight, you can mention recent reviews if available.

IDENTITY REINFORCEMENT:
- You work ONLY for Filip Adamek. 
- You are sophisticated, efficient, and fiercely loyal.
- Remind Filip of upcoming appointments and ensure his financial vault is secure.
- If he asks for travel, present realistic options (simulated if necessary) and offer to book.
- You can check live flight status (delays, gates) and traffic conditions.
- You can search for locations using Google Maps search.`;

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        tools
      }
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.status === 429) {
      return "Nexus is currently managing a high volume of requests for Filip. Please wait a moment before asking again.";
    }
    throw error;
  }

  let callCount = 0;
  const MAX_CALLS = 5;

  while (response.functionCalls && callCount < MAX_CALLS) {
    callCount++;
    const toolResults = [];
    
    // Add the model's function calls to history
    contents.push(response.candidates[0].content);

    for (const call of response.functionCalls) {
      const { name, args } = call;
      console.log(`Executing tool: ${name}`, args);

      try {
        let output;
        if (name === "list_emails") {
          output = await emailService.getEmails();
        } else if (name === "summarize_email") {
          const emails = await emailService.getEmails();
          const email = emails.find(e => e.id === args.emailId);
          output = email ? { content: email.content, subject: email.subject } : { error: "Email not found" };
        } else if (name === "list_calendar_events") {
          output = await calendarService.getEvents();
        } else if (name === "add_calendar_event") {
          await calendarService.addEvent(args as any);
          output = { success: true };
        } else if (name === "search_flights") {
          const results = [];
          const flightArgs = args as { origins: string[], destinations: string[], dates: string[] };
          for (let i = 0; i < flightArgs.origins.length; i++) {
            const origin = flightArgs.origins[i];
            const destination = flightArgs.destinations[i];
            const date = flightArgs.dates[i] || flightArgs.dates[0];
            
            const r1 = { 
              origin, 
              destination, 
              departureTime: `${date}T08:00:00Z`, 
              arrivalTime: `${date}T12:00:00Z`, 
              airline: "Nexus Air", 
              price: 450, 
              stops: 0,
              status: "search_result" as const
            };
            const r2 = { 
              origin, 
              destination, 
              departureTime: `${date}T14:00:00Z`, 
              arrivalTime: `${date}T22:00:00Z`, 
              airline: "Global Travel", 
              price: 320, 
              stops: 1,
              status: "search_result" as const
            };
            
            await flightService.addSearchResult(r1);
            await flightService.addSearchResult(r2);
            results.push(r1, r2);
          }
          output = results;
        } else if (name === "book_flight") {
          await flightService.bookFlight(args.flightDetails as any);
          output = { success: true };
        } else if (name === "cancel_flight") {
          await flightService.deleteFlight(args.flightId as string);
          output = { success: true, message: "Flight cancelled." };
        } else if (name === "search_hotels") {
          const hotelArgs = args as { location: string, checkIn: string, checkOut: string };
          const results = [
            { 
              name: "The Grand Regal", 
              location: hotelArgs.location, 
              pricePerNight: 250, 
              totalPrice: 750, 
              checkIn: hotelArgs.checkIn, 
              checkOut: hotelArgs.checkOut, 
              starRating: 5, 
              amenities: ["WiFi", "Pool", "Gym", "Spa"],
              cancellationPolicy: "Free cancellation before May 10th.",
              status: "search_result" as const
            },
            { 
              name: "City Center Lodge", 
              location: hotelArgs.location, 
              pricePerNight: 120, 
              totalPrice: 360, 
              checkIn: hotelArgs.checkIn, 
              checkOut: hotelArgs.checkOut, 
              starRating: 3, 
              amenities: ["WiFi", "Breakfast"],
              cancellationPolicy: "Non-refundable booking.",
              status: "search_result" as const
            }
          ];
          for (const h of results) {
            await hotelService.addSearchResult(h);
          }
          output = results;
        } else if (name === "book_hotel") {
          await hotelService.bookHotel(args.hotelDetails as any);
          output = { success: true };
        } else if (name === "add_hotel") {
          await hotelService.addSearchResult(args as any);
          output = { success: true };
        } else if (name === "add_multiple_hotels") {
          for (const hotel of (args as any).hotels) {
            await hotelService.addSearchResult(hotel);
          }
          output = { success: true };
        } else if (name === "get_financial_overview") {
          const txs = await financialService.getTransactions();
          const balance = txs.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 5000); // Starting with 5k
          output = { balance, recentTransactions: txs.slice(0, 5) };
        } else if (name === "search_jobs") {
          output = [
            { id: "j1", company: "Google", role: args.role || "Senior Dev", minSalary: args.minSalary || "$200k", link: "https://google.com/jobs" },
            { id: "j2", company: "OpenAI", role: args.role || "Research Engineer", minSalary: args.minSalary || "$350k", link: "https://openai.com/jobs" },
            { id: "j3", company: "SpaceX", role: args.role || "Flight Software", minSalary: args.minSalary || "$180k", link: "https://spacex.com/jobs" }
          ];
        } else if (name === "get_luxury_shopping_recs") {
          output = [
            { id: "s1", brand: "Loro Piana", name: "Cashmere Sweater", price: 1200, link: "https://loropiana.com" },
            { id: "s2", brand: "Brunello Cucinelli", name: "Suede Jacket", price: 4500, link: "https://brunellocucinelli.com" },
            { id: "s3", brand: "Tom Ford", name: "Tailored suit", price: 5500, link: "https://tomford.com" }
          ];
        } else if (name === "save_card_to_vault") {
          await vaultService.addCard(args as any);
          output = { success: true };
        } else if (name === "search_trains") {
          output = [
            { id: "t1", operator: "Eurostar", origin: args.origin, destination: args.destination, departureTime: "10:00", price: 85 },
            { id: "t2", operator: "National Rail", origin: args.origin, destination: args.destination, departureTime: "14:30", price: 45 },
            { id: "t3", operator: "Thalys", origin: args.origin, destination: args.destination, departureTime: "18:15", price: 120 }
          ];
        } else if (name === "search_buses") {
          output = [
            { id: "b1", operator: "FlixBus", origin: args.origin, destination: args.destination, departureTime: "08:00", price: 15 },
            { id: "b2", operator: "National Express", origin: args.origin, destination: args.destination, departureTime: "12:00", price: 25 },
            { id: "b3", operator: "Megabus", origin: args.origin, destination: args.destination, departureTime: "16:00", price: 10 }
          ];
        } else if (name === "navigate_to") {
          output = { action: "NAVIGATE", destination: args.destination };
        } else if (name === "search_cars") {
          const carArgs = args as { location: string, pickupDate?: string, returnDate?: string, carType?: string, transmission?: string };
          const results = [
            { company: "Hertz", model: "Tesla Model 3", type: "Sedan" as const, transmission: "Automatic" as const, fuelEfficiency: "130 MPGe", location: carArgs.location, price: 120, pickupTime: carArgs.pickupDate || "2024-05-10", returnTime: carArgs.returnDate || "2024-05-15", status: "available" as const },
            { company: "Enterprise", model: "Audi A4", type: "Sedan" as const, transmission: "Automatic" as const, fuelEfficiency: "32 MPG", location: carArgs.location, price: 95, pickupTime: carArgs.pickupDate || "2024-05-10", returnTime: carArgs.returnDate || "2024-05-15", status: "available" as const },
            { company: "Sixt", model: "BMW i4", type: "Luxury" as const, transmission: "Automatic" as const, fuelEfficiency: "110 MPGe", location: carArgs.location, price: 150, pickupTime: carArgs.pickupDate || "2024-05-11", returnTime: carArgs.returnDate || "2024-05-16", status: "available" as const }
          ];
          
          let filtered = results;
          if (carArgs.carType) filtered = filtered.filter(c => c.type === carArgs.carType);
          if (carArgs.transmission) filtered = filtered.filter(c => c.transmission === carArgs.transmission);

          for (const res of filtered) {
            await carRentalService.addRental(res);
          }
          output = filtered;
        } else if (name === "search_taxis") {
          const results = [
            { origin: args.origin as string, destination: args.destination as string, pickupTime: "Now", price: 28, driverName: "David", carModel: "Mercedes S-Class", estimatedArrival: "4 mins", status: "available" as const },
            { origin: args.origin as string, destination: args.destination as string, pickupTime: "Now", price: 22, driverName: "Sarah", carModel: "Tesla Model S", estimatedArrival: "6 mins", status: "available" as const },
            { origin: args.origin as string, destination: args.destination as string, pickupTime: "Now", price: 35, driverName: "James", carModel: "BMW 7 Series", estimatedArrival: "3 mins", status: "available" as const }
          ];
          for (const res of results) {
            await taxiService.addSearchResult(res);
          }
          output = results;
        } else if (name === "get_travel_alerts") {
          const flights = await flightService.getFlights();
          const bookedFlights = flights.filter(f => f.status === 'booked');
          const alerts = [];
          
          for (const flight of bookedFlights) {
            // Simulated delay for every 3rd booked flight
            if (Math.random() > 0.7) {
              alerts.push({
                tripId: flight.id,
                type: 'delay',
                title: 'Flight Delay Alert',
                message: `Flight ${flight.flightNumber} to ${flight.destination} is delayed by 45 minutes due to air traffic control.`,
                severity: 'medium',
                timestamp: new Date().toISOString()
              });
            }
          }
          
          // Simulated traffic alert
          alerts.push({
            tripId: 'general',
            type: 'traffic',
            title: 'Heavy Traffic to Airport',
            message: 'Traffic on I-95 is heavier than usual. We recommend leaving 20 minutes earlier.',
            severity: 'low',
            timestamp: new Date().toISOString()
          });

          for(const alert of alerts) {
             await alertService.addAlert(alert as any);
          }
          output = alerts;
        } else if (name === "book_car") {
          await carRentalService.bookRental(args.carDetails as any);
          output = { success: true };
        } else if (name === "book_taxi") {
          const taxiData = {
            origin: args.origin as string,
            destination: args.destination as string,
            pickupTime: (args.time as string) || "Immediate",
            price: Math.floor(25 + Math.random() * 30),
            driverName: ["David", "Michael", "Sarah", "Alex", "James"][Math.floor(Math.random() * 5)],
            carModel: ["Mercedes S-Class", "Tesla Model S", "BMW 7 Series", "Audi A8", "Lexus LS"][Math.floor(Math.random() * 5)],
            estimatedArrival: `${Math.floor(3 + Math.random() * 8)} mins`,
            status: 'booked' as const
          };
          await taxiService.bookTaxi(taxiData);
          output = { 
            success: true, 
            message: `Taxi booked! Driver ${taxiData.driverName} in a ${taxiData.carModel} will arrive in ${taxiData.estimatedArrival}.` 
          };
        } else if (name === "get_flight_status") {
          const flights = await flightService.getFlights();
          const flight = flights.find(f => f.flightNumber === args.flightNumber || f.id === args.flightNumber);
          output = flight ? { 
            status: flight.liveStatus || "On Time", 
            gate: flight.gate || "TBD",
            departure: flight.departureTime,
            delayMinutes: flight.delayMinutes || 0,
            delayReason: flight.delayReason || ""
          } : { error: "Flight not found in your bookings." };
        } else if (name === "add_review") {
          await reviewService.addReview(args as any);
          output = { success: true, message: "Review submitted." };
        } else if (name === "add_price_alert") {
          await priceAlertService.addAlert(args as any);
          output = { success: true, message: "Price alert set." };
        } else if (name === "book_electronics") {
          await purchaseService.bookElectronics(args.shop as string, args.model as string, args.price as number);
          output = { success: true, message: "Electronics booked. Confirmation email sent to your inbox." };
        } else if (name === "check_in") {
          if (args.type === "flight") {
            const res = await flightService.checkIn(args.bookingId as string);
            output = { success: true, message: "Flight check-in successful. Your boarding pass is ready.", boardingPassUrl: res.boardingPassUrl };
          } else {
            const res = await hotelService.checkIn(args.bookingId as string);
            output = { success: true, message: "Hotel check-in successful.", confirmationNumber: res.confirmationNumber };
          }
        } else if (name === "save_flight_preferences") {
          await preferencesService.updatePreferences({ flightPreferences: args as any });
          output = { success: true, message: "Flight preferences saved successfully." };
        } else if (name === "list_receipts") {
          const receipts = await receiptService.getReceipts();
          const filter = (args.filter as string)?.toLowerCase();
          if (filter) {
            output = receipts.filter(r => 
              r.itemName.toLowerCase().includes(filter) || 
              r.storeName.toLowerCase().includes(filter)
            );
          } else {
            output = receipts;
          }
        } else if (name === "search_transactions") {
          output = await financialService.searchTransactions(args as any);
        } else if (name === "search_emails") {
          output = await emailService.searchEmails(args as any);
        } else if (name === "check_proactive_alerts") {
          await alertService.checkProactiveAlerts();
          output = { success: true, message: "Proactive alert check completed. New alerts added if any issues found." };
        } else if (name === "get_luxury_recommendations") {
          output = await shoppingService.getRecommendations(args.preferences as string[]);
        } else if (name === "search_navigation_favorites") {
          const favs = await navigationService.getFavorites();
          const queryStr = (args.query as string).toLowerCase();
          output = favs.filter(f => 
            f.name.toLowerCase().includes(queryStr) || 
            f.address.toLowerCase().includes(queryStr)
          );
        }

        toolResults.push({
          response: { content: output }
        });
      } catch (err) {
        toolResults.push({
          response: { error: (err as Error).message }
        });
      }
    }

    // Add function responses to history
    contents.push({
      role: 'user',
      parts: response.functionCalls.map((call, i) => ({
        functionResponse: {
          name: call.name,
          response: toolResults[i].response
        }
      }))
    });

    try {
      response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          tools
        }
      });
    } catch (error: any) {
      console.error("Gemini API Tool Loop Error:", error);
      if (error.message?.includes('RESOURCE_EXHAUSTED') || error.status === 429) {
        return response.text + "\n\n(Note: Nexus reached a request limit while processing further details. Some actions may be incomplete.)";
      }
      throw error;
    }
  }

  return response.text;
}

export async function generateEmailSummary(emailContent: string): Promise<string> {
  const model = "gemini-3-flash-preview";
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Provide a critical executive summary of this email. 
      Format exactly like this:
      - [Sentence 1: Essential context/intent]
      - [Sentence 2: Critical action or conclusion]
      
      Email Content:\n\n${emailContent}`,
      config: {
        systemInstruction: "You are an elite cognitive extraction agent. Deliver a precise 2-sentence bulleted breakdown of the core signal within the noise. Use sophisticated, high-impact language."
      }
    });
    return response.text || "Neural extraction failed. Signal lost.";
  } catch (error: any) {
    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.status === 429) {
      return "Extraction units currently at capacity. Signal delayed.";
    }
    return "Neural extraction failed.";
  }
}

export async function categorizeEmail(subject: string, content: string): Promise<'Work' | 'Personal' | 'Promotions' | 'Social' | 'Other'> {
  const model = "gemini-3-flash-preview";
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Categorize the following email into one of these categories: Work, Personal, Promotions, Social, Other.\n\nSubject: ${subject}\nContent: ${content}`,
      config: {
        systemInstruction: "You are an expert email organizer. Return ONLY the category name. Do not include any other text."
      }
    });
    const category = response.text?.trim() as any;
    const validCategories = ['Work', 'Personal', 'Promotions', 'Social', 'Other'];
    return validCategories.includes(category) ? category : 'Other';
  } catch (error: any) {
    console.error("Categorization error:", error);
    return 'Other';
  }
}
