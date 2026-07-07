import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import RefundPolicy from "./pages/RefundPolicy";
import Disclaimer from "./pages/Disclaimer";
import Contact from "./pages/Contact";
import PhoneLogin from "./pages/PhoneLogin";
import ConsultationComingSoon from "./pages/ConsultationComingSoon";
import SocialLanding from "./pages/SocialLanding";
import EligibilityQuiz from "./pages/EligibilityQuiz";
import ImportationBasis from "./pages/ImportationBasis";
import NotFound from "./pages/NotFound";

// Layouts
import { PatientLayout } from "@/components/layout/PatientLayout";
import { DoctorLayout } from "@/components/layout/DoctorLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

// Patient pages
import PatientDashboard from "./pages/patient/Dashboard";
import PatientConsultations from "./pages/patient/Consultations";
import UploadPrescription from "./pages/patient/UploadPrescription";
import PatientPrescriptions from "./pages/patient/Prescriptions";
import PatientShop from "./pages/patient/Shop";
import PatientProductDetail from "./pages/patient/ProductDetail";
import PatientShopCheckout from "./pages/patient/ShopCheckout";
import PatientAccount from "./pages/patient/Account";
import PatientOrders from "./pages/patient/Orders";
import PatientOrderSuccess from "./pages/patient/OrderSuccess";

// Doctor pages
import DoctorDashboard from "./pages/doctor/Dashboard";
import DoctorPending from "./pages/doctor/Pending";
import DoctorAccount from "./pages/doctor/Account";
import DoctorHalaxyConsults from "./pages/doctor/HalaxyConsults";
// Payslip print removed (contractor remittances model)

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminDoctors from "./pages/admin/Doctors";
import AdminDoctorApprovals from "./pages/admin/DoctorApprovals";
import AdminBookings from "./pages/admin/Bookings";
import AdminOrders from "./pages/admin/Orders";
import AdminCatalog from "./pages/admin/Catalog";
import AdminUsers from "./pages/admin/Users";
import AdminPrescriptions from "./pages/admin/Prescriptions";
import AdminPrescriptionUploads from "./pages/admin/PrescriptionUploads";
import AdminHalaxyConsults from "./pages/admin/HalaxyConsults";

// SEO / Guides (public)
import GuideZynAustralia from "./pages/guides/ZynAustralia";
import GuideNicotinePouchesVsVaping from "./pages/guides/NicotinePouchesVsVaping";
import GuideNicotinePouchesAustralia from "./pages/guides/NicotinePouchesAustralia";
import GuidesIndex from "./pages/guides/GuidesIndex";
import GuideAreNicotinePouchesLegalAustralia from "./pages/guides/AreNicotinePouchesLegalAustralia";
import GuideHowToGetNicotinePouchesAustralia from "./pages/guides/HowToGetNicotinePouchesAustralia";
import GuidePersonalImportationSchemeNicotinePouches from "./pages/guides/PersonalImportationSchemeNicotinePouches";
import GuideNicotinePouchStrengthGuide from "./pages/guides/NicotinePouchStrengthGuide";
import GuideZynVsOtherNicotinePouches from "./pages/guides/ZynVsOtherNicotinePouches";
import GlobalSchema from "@/components/seo/GlobalSchema";
import NoIndexRoutes from "@/components/seo/NoIndexRoutes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <GlobalSchema />
          <BrowserRouter>
            <NoIndexRoutes />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/importation-basis" element={<ImportationBasis />} />
              <Route path="/auth" element={<Navigate to="/phone-login" replace />} />
              <Route path="/auth/callback" element={<Navigate to="/phone-login" replace />} />
              <Route path="/phone-login" element={<PhoneLogin />} />
              <Route path="/start-consult" element={<ConsultationComingSoon />} />
              <Route path="/start" element={<SocialLanding />} />
              <Route path="/patient/start-consult" element={<ConsultationComingSoon />} />
              <Route path="/eligibility" element={<EligibilityQuiz />} />
              <Route path="/patient/book" element={<Navigate to="/start-consult" replace />} />
              <Route path="/patient/booking/payment/:bookingId" element={<Navigate to="/patient/consultations" replace />} />
              <Route path="/patient/booking/confirmation/:bookingId" element={<Navigate to="/patient/consultations" replace />} />
              <Route path="/patient/intake" element={<Navigate to="/patient/consultations" replace />} />
              <Route path="/patient/intake/:bookingId" element={<Navigate to="/patient/consultations" replace />} />

              {/* SEO guides (public) */}
              <Route path="/guides" element={<GuidesIndex />} />
              <Route path="/guides/zyn-australia" element={<GuideZynAustralia />} />
              <Route path="/guides/nicotine-pouches-australia" element={<GuideNicotinePouchesAustralia />} />
              <Route path="/guides/are-nicotine-pouches-legal-in-australia" element={<GuideAreNicotinePouchesLegalAustralia />} />
              <Route path="/guides/how-to-get-nicotine-pouches-in-australia" element={<GuideHowToGetNicotinePouchesAustralia />} />
              <Route path="/guides/personal-importation-scheme-nicotine-pouches" element={<GuidePersonalImportationSchemeNicotinePouches />} />
              <Route path="/guides/nicotine-pouch-strength-3mg-6mg-9mg" element={<GuideNicotinePouchStrengthGuide />} />
              <Route path="/guides/zyn-vs-other-nicotine-pouches" element={<GuideZynVsOtherNicotinePouches />} />
              <Route path="/guides/nicotine-pouches-vs-vaping" element={<GuideNicotinePouchesVsVaping />} />

              {/* Patient routes */}
              <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']}><PatientLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<PatientDashboard />} />
                <Route path="book" element={<Navigate to="/patient/start-consult" replace />} />
                <Route path="booking/payment/:bookingId" element={<Navigate to="/patient/consultations" replace />} />
                <Route path="booking/confirmation/:bookingId" element={<Navigate to="/patient/consultations" replace />} />
                <Route path="consultations" element={<PatientConsultations />} />
                {/* Halaxy owns patient clinical intake. PouchCare does not collect intake/quiz answers. */}
                <Route path="intake" element={<PatientConsultations />} />
                <Route path="intake/:bookingId" element={<Navigate to="/patient/consultations" replace />} />
                <Route path="upload-prescription" element={<UploadPrescription />} />
                <Route path="prescriptions" element={<PatientPrescriptions />} />
                <Route path="shop" element={<PatientShop />} />
                <Route path="shop/checkout" element={<PatientShopCheckout />} />
                <Route path="shop/:productId" element={<PatientProductDetail />} />
                <Route path="orders" element={<PatientOrders />} />
                <Route path="order-success" element={<PatientOrderSuccess />} />
                <Route path="account" element={<PatientAccount />} />
              </Route>

              {/* Doctor routes */}
              <Route path="/doctor/pending" element={<DoctorPending />} />
              {/* Payslip print removed (contractor remittances model). */}
              <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/doctor/halaxy-consults" replace />} />
                <Route path="dashboard" element={<DoctorDashboard />} />
                <Route path="halaxy-consults" element={<DoctorHalaxyConsults />} />
                <Route path="account" element={<DoctorAccount />} />
                {/* MVP: doctors only need account info and assigned Halaxy consultations with prescription upload. */}
                <Route path="onboarding" element={<Navigate to="/doctor/halaxy-consults" replace />} />
                <Route path="calendar" element={<Navigate to="/doctor/halaxy-consults" replace />} />
                <Route path="availability" element={<Navigate to="/doctor/halaxy-consults" replace />} />
                <Route path="bookings" element={<Navigate to="/doctor/halaxy-consults" replace />} />
                <Route path="booking/:id" element={<Navigate to="/doctor/halaxy-consults" replace />} />
                <Route path="consultations" element={<Navigate to="/doctor/halaxy-consults" replace />} />
                <Route path="consultation/:id" element={<Navigate to="/doctor/halaxy-consults" replace />} />
                <Route path="patients" element={<Navigate to="/doctor/halaxy-consults" replace />} />
                <Route path="patient/:id" element={<Navigate to="/doctor/halaxy-consults" replace />} />
                <Route path="prescriptions" element={<Navigate to="/doctor/halaxy-consults" replace />} />
                <Route path="earnings" element={<Navigate to="/doctor/halaxy-consults" replace />} />
                <Route path="info" element={<Navigate to="/doctor/halaxy-consults" replace />} />
              </Route>

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="doctors" element={<AdminDoctors />} />
                <Route path="doctor-approvals" element={<AdminDoctorApprovals />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="halaxy-consults" element={<AdminHalaxyConsults />} />
                <Route path="catalog" element={<AdminCatalog />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="prescriptions" element={<AdminPrescriptions />} />
                <Route path="prescription-uploads" element={<AdminPrescriptionUploads />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
