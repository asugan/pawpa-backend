// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Request/Response types for each entity
export interface CreatePetRequest {
  name: string;
  type: string;
  breed?: string;
  birthDate?: string;
  weight?: number;
  gender?: 'male' | 'female' | 'other';
  profilePhoto?: string;
}

export interface UpdatePetRequest {
  name?: string;
  type?: string;
  breed?: string;
  birthDate?: string;
  weight?: number;
  gender?: 'male' | 'female' | 'other';
  profilePhoto?: string;
}

export interface CreateHealthRecordRequest {
  petId: string;
  type: string;
  title: string;
  description?: string;
  date: string;
  veterinarian?: string;
  clinic?: string;
  cost?: number;
  nextDueDate?: string;
  attachments?: string;
  vaccineName?: string;
  vaccineManufacturer?: string;
  batchNumber?: string;
}

export interface UpdateHealthRecordRequest {
  type?: string;
  title?: string;
  description?: string;
  date?: string;
  veterinarian?: string;
  clinic?: string;
  cost?: number;
  nextDueDate?: string;
  attachments?: string;
  vaccineName?: string;
  vaccineManufacturer?: string;
  batchNumber?: string;
}

export interface CreateEventRequest {
  petId: string;
  title: string;
  description?: string;
  type: string;
  startTime: string;
  endTime?: string;
  location?: string;
  notes?: string;
  reminder?: boolean;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  type?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  notes?: string;
  reminder?: boolean;
}

export interface CreateFeedingScheduleRequest {
  petId: string;
  time: string;
  foodType: string;
  amount: string;
  days: string;
  isActive?: boolean;
}

export interface UpdateFeedingScheduleRequest {
  time?: string;
  foodType?: string;
  amount?: string;
  days?: string;
  isActive?: boolean;
}

// Database entity types (re-exported from schema)
export type { Pet, NewPet, HealthRecord, NewHealthRecord, Event, NewEvent, FeedingSchedule, NewFeedingSchedule } from '../models/schema';

// Query parameter types
export interface PetQueryParams extends PaginationParams {
  type?: string;
  breed?: string;
  gender?: string;
}

export interface HealthRecordQueryParams extends PaginationParams {
  type?: string;
  startDate?: string;
  endDate?: string;
}

export interface EventQueryParams extends PaginationParams {
  type?: string;
  startDate?: string;
  endDate?: string;
  date?: string; // For calendar view
}

export interface FeedingScheduleQueryParams extends PaginationParams {
  isActive?: boolean;
  foodType?: string;
}