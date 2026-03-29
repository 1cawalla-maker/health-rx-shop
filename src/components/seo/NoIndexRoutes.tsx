import { useLocation } from 'react-router-dom';
import Seo from './Seo';

// Ensures non-public route areas never appear in search results.
// This does not change UI layout; it only adds a meta robots tag.
const NOINDEX_PREFIXES = ['/patient', '/doctor', '/admin', '/auth', '/eligibility'];

export default function NoIndexRoutes() {
  const { pathname } = useLocation();

  const shouldNoIndex = NOINDEX_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!shouldNoIndex) return null;

  return <Seo title="" noIndex />;
}
