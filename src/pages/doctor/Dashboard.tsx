import { Navigate } from 'react-router-dom';

export default function DoctorDashboard() {
  return <Navigate to="/doctor/consultations" replace />;
}
