export type BarberRank = 'Junior Barber' | 'Barber' | 'Senior Barber' | 'Top Barber' | 'Brand Master';

export interface Barber {
  id: string;
  name: string;
  rank: BarberRank;
  experienceYears: number;
  rating: number;
  reviewsCount: number;
  avatarUrl: string;
  bio: string;
  specialties: string[];
  portfolioImages: {
    url: string;
    title: string;
  }[];
  scheduleText: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  price: number;
  popular?: boolean;
  category: 'haircuts' | 'beard' | 'combo' | 'spa_care' | 'kids';
  masterTierPricing?: {
    barber: number;
    topBarber: number;
    brandMaster: number;
  };
}

export interface ServiceCategory {
  id: 'haircuts' | 'beard' | 'combo' | 'spa_care' | 'kids';
  name: string;
  iconName: string;
  description: string;
}

export interface CustomerReview {
  id: string;
  authorName: string;
  rating: number;
  date: string;
  text: string;
  serviceTitle?: string;
  masterName?: string;
  verified: boolean;
  source: 'Altegio' | 'Google Maps';
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: 'haircut' | 'beard' | 'fade' | 'classic';
  imageUrl: string;
  masterName: string;
}

export interface BookingState {
  serviceId: string | null;
  masterId: string | null;
  date: string | null;
  time: string | null;
  clientName: string;
  clientPhone: string;
  clientComment: string;
}

export interface AltegioSettings {
  enabledLiveWidget: boolean;
  widgetUrl: string;
  companyId: string;
  buttonColor: string;
}
