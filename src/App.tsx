import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Disclaimer from "./pages/Disclaimer";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Layouts
import { PatientLayout } from "@/components/layout/PatientLayout";
import { DoctorLayout } from "@/components/layout/DoctorLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

// Patient pages
import PatientDashboard from "./pages/patient/Dashboard";
import BookConsultation from "./pages/patient/BookConsultation";
import PatientConsultations from "./pages/patient/Consultations";
import UploadPrescription from "./pages/patient/UploadPrescription";
import PatientPrescriptions from "./pages/patient/Prescriptions";
import PatientShop from "./pages/patient/Shop";
import PatientIntake from "./pages/patient/Intake";
import PatientAccount from "./pages/patient/Account";

// Doctor pages
import DoctorDashboard from "./pages/doctor/Dashboard";
import DoctorPending from "./pages/doctor/Pending";
import DoctorConsultations from "./pages/doctor/Consultations";
import DoctorPrescriptions from "./pages/doctor/Prescriptions";
import DoctorCalendar from "./pages/doctor/Calendar";
import DoctorBookings from "./pages/doctor/Bookings";
import DoctorBookingDetail from "./pages/doctor/BookingDetail";
import DoctorPatients from "./pages/doctor/Patients";
import DoctorPatientDetail from "./pages/doctor/PatientDetail";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminPrescriptions from "./pages/admin/Prescriptions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />

            {/* Patient routes */}
            <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']}><PatientLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<PatientDashboard />} />
              <Route path="book" element={<BookConsultation />} />
              <Route path="consultations" element={<PatientConsultations />} />
              <Route path="intake/:bookingId" element={<PatientIntake />} />
              <Route path="upload-prescription" element={<UploadPrescription />} />
              <Route path="prescriptions" element={<PatientPrescriptions />} />
              <Route path="shop" element={<PatientShop />} />
              <Route path="account" element={<PatientAccount />} />
            </Route>

            {/* Doctor routes */}
            <Route path="/doctor/pending" element={<DoctorPending />} />
            <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<DoctorDashboard />} />
              <Route path="calendar" element={<DoctorCalendar />} />
              <Route path="bookings" element={<DoctorBookings />} />
              <Route path="booking/:id" element={<DoctorBookingDetail />} />
              <Route path="consultations" element={<DoctorConsultations />} />
              <Route path="patients" element={<DoctorPatients />} />
              <Route path="patient/:id" element={<DoctorPatientDetail />} />
              <Route path="prescriptions" element={<DoctorPrescriptions />} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="prescriptions" element={<AdminPrescriptions />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
