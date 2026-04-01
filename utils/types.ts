/**
 * Types centralisés du projet Fluvex
 * Tous les types du projet sont regroupés ici pour une meilleure scalabilité.
 */

// Re-exports depuis lib/validations
export type {
  CreateDeliveryInput,
  UpdateDeliveryInput,
} from '@/lib/validations/delivery';
export type {
  CreateDriverInput,
  UpdateDriverInput,
} from '@/lib/validations/driver';
export type {
  CreateVehicleInput,
  UpdateVehicleInput,
} from '@/lib/validations/vehicle';
export type {
  UpdateCompanyInput,
  NotificationPrefsInput,
} from '@/lib/validations/company';
export type {
  RegisterCompanyInput,
  RegisterUserInput,
  LoginInput,
} from '@/lib/validations/auth';

// i18n
export type { Lang } from '@/lib/i18n';

// Auth / Register
export type RegisterFormData = {
  companyName: string;
  email: string;
  address: string;
  city?: string;
  country: string;
  fleetSize: string;
  industry: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
};

// Toast
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}
export interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

// Sidebar
export type SidebarContextValue = {
  collapsed: boolean;
  toggle: () => void;
};

// Confirm Dialog
export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
};

// Map / Geocoding
export type PlaceResult = {
  id: string;
  place_name: string;
  center: [number, number];
  context?: Array<{ id: string; short_code: string }>;
};

// API / Domain
export type UploadedFile = {
  url: string;
  publicId: string;
  bytes: number;
  originalFilename: string;
  mimeType: string;
};

export type Driver = { id: string; name: string; code: string };
export type Vehicle = { id: string; name: string; plateNumber: string | null };
export type DriverOption = Driver;
export type VehicleOption = Vehicle;

export type Company = { name?: string; address?: string; city?: string; country?: string };
export type DeliveryApi = {
  id: string;
  trackingId: string;
  deliveryAddress?: string | null;
  recipientCompany?: string | null;
  routes?: { origin?: string | null; destination?: string | null; distanceKm?: number | null; score?: number | null }[];
};

// Dashboard
export type RecentDelivery = {
  id: string;
  trackingId: string;
  driver?: { name: string; avatarUrl?: string | null };
  status: string;
  amount: unknown;
  currency: string;
};

export type DashboardStats = {
  activeDeliveries: number;
  completedThisMonth: number;
  fleetTotal: number;
  fleetActive: number;
  co2SavedKg: number;
  totalRevenue: number;
  period: string;
  from?: string | null;
  to?: string | null;
};

// Deliveries
export type DeliveryRow = {
  id: string;
  trackingId: string;
  client: string;
  status: string;
  statusLabel: string;
  driver: string;
  driverId: string | null;
  vehicleId: string | null;
  dest: string;
  amount: string;
  currency: string;
  contactName?: string;
  contactPhone?: string;
  packageName?: string | null;
  weightKg?: number | null;
  dimensionsL?: number | null;
  dimensionsW?: number | null;
  dimensionsH?: number | null;
  packageType?: string | null;
  scheduledAt?: string | null;
  createdAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
};

// Fleet
export type DriverRow = {
  id: string;
  name: string;
  code: string;
  email?: string;
  status: string;
  vehicleName?: string;
  plateNumber?: string | null;
};

// Form field errors (génériques)
export type FieldErrors = Record<string, string | undefined>;

export type DriverFormFieldErrors = {
  name?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  avatarUrl?: string;
  docs?: string;
};

export type DeliveryFormFieldErrors = {
  companyName?: string;
  contactName?: string;
  phoneNumber?: string;
  deliveryAddress?: string;
  weight?: string;
  length?: string;
  width?: string;
  height?: string;
  packageType?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  amount?: string;
  driverId?: string;
  vehicleId?: string;
};

// Sustainability
export type RouteItem = {
  id: string;
  type: 'diesel' | 'electric';
  from: string;
  to: string;
  co2: string;
  dist: string;
  badge: string;
  score: string;
};

export type RouteShape = { origin: string | null; destination: string | null; score: number | null };
export type CorridorGeo = { coordinates: [number, number][]; efficiency: 'high' | 'medium' | 'low' };

// Analytics
export type Delivery = {
  id: string;
  trackingId: string;
  status: string;
  amount?: number;
  currency: string;
};
export type VehicleStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
export type Alert = {
  id: string;
  type: string;
  message: string;
  time: string;
};

// Sustainability metrics
export type SustainabilityMetric = {
  label: string;
  value: string;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
};

// Map
export type LiveLocation = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
};

// Theme
export type Theme = 'light' | 'dark';

// Drivers page
export type RouteRow = {
  id: string;
  trackingId: string;
  status: string;
  driver?: string;
};

export type DriverFromServer = {
  id: string
  code: string
  name: string
  status: string
  phone: string | null
  email: string
  role: string | null
  region: string | null
  avatarUrl: string | null
  createdAt: Date | string
  vehicle: { name: string } | null
}

export type DeliveryFromServer = {
  id: string
  trackingId: string
  status: string
  createdAt: Date | string
  amount: number | null
  currency: string
  driverId: string | null
}

export type RouteRow = {
  id: string
  date: string
  time: string
  route: string
  distance: string
  score: number
  status: string
}

export type ChartDelivery = { createdAt: string; status: string; amount: number | null }

