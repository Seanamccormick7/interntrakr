import { ApplicationStatus } from "../types/application.types";

export interface UserData {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationData {
  id: string;
  userId: string;
  collaborators: string[];
  company: string;
  role: string;
  location?: string;
  link?: string;
  status: ApplicationStatus;
  deadline?: Date;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  deadlineSoon?: boolean;
  q?: string;
}

export interface CreateApplicationData {
  company: string;
  role: string;
  location?: string;
  link?: string;
  status?: ApplicationStatus;
  deadline?: Date;
  notes?: string;
  tags?: string[];
  collaborators?: string[];
}

export interface UpdateApplicationData {
  company?: string;
  role?: string;
  location?: string;
  link?: string;
  status?: ApplicationStatus;
  deadline?: Date;
  notes?: string;
  tags?: string[];
  collaborators?: string[];
}

export interface IUserRepository {
  findByEmail(email: string): Promise<UserData | null>;
  findById(id: string): Promise<UserData | null>;
  create(email: string, password: string): Promise<UserData>;
  findByEmailWithPassword(email: string): Promise<UserData | null>;
}

export interface IApplicationRepository {
  find(userId: string, filters: ApplicationFilters): Promise<ApplicationData[]>;
  findById(id: string, userId: string): Promise<ApplicationData | null>;
  create(userId: string, data: CreateApplicationData): Promise<ApplicationData>;
  update(
    id: string,
    userId: string,
    data: UpdateApplicationData,
  ): Promise<ApplicationData | null>;
  delete(id: string, userId: string): Promise<boolean>;
}
