import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { fallbackHome, getHomeData } from './services/publicApi';
import { ApplicationProvider } from './components/ApplicationModal';
import { PublicLayout } from './layouts/PublicLayout';
import { JoinCommunityPage } from './pages/JoinCommunityPage';
import {
  AboutPage, AnnouncementsPage, CommunityPage, ContactPage, EventsPage, FaqPage,
  HomePage, LegalPage, ListingPage, NotFoundPage, RolePage, DynamicRolePage
} from './pages/PublicPages';
import { AdminRoutes } from './admin/AdminApp';
import './App.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function PublicRoutes({ data, loading, error }) {
  return (
    <ApplicationProvider formLinks={data.formLinks}>
      <PublicLayout data={data}>
        <Routes>
          <Route path="/" element={<HomePage data={data} loading={loading} error={error} />} />
          <Route path="/about" element={<AboutPage data={data} />} />
          <Route path="/opportunities" element={<ListingPage data={data} />} />
          <Route path="/community" element={<CommunityPage data={data} />} />
          <Route path="/join-community" element={<JoinCommunityPage />} />
          <Route path="/volunteer" element={<RolePage slug="volunteer" data={data} />} />
          <Route path="/district-representative" element={<RolePage slug="district-representative" data={data} />} />
          <Route path="/state-representative" element={<RolePage slug="state-representative" data={data} />} />
          <Route path="/campus-ambassador" element={<RolePage slug="campus-ambassador" data={data} premium />} />
          <Route path="/opportunities/:slug" element={<DynamicRolePage data={data} />} />
          <Route path="/events" element={<EventsPage data={data} />} />
          <Route path="/announcements" element={<AnnouncementsPage data={data} />} />
          <Route path="/faq" element={<FaqPage data={data} />} />
          <Route path="/contact" element={<ContactPage data={data} />} />
          <Route path="/privacy" element={<LegalPage type="Privacy Policy" />} />
          <Route path="/terms" element={<LegalPage type="Terms & Conditions" />} />
          <Route path="/code-of-conduct" element={<LegalPage type="Code of Conduct" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </PublicLayout>
    </ApplicationProvider>
  );
}

function App() {
  const [data, setData] = useState(fallbackHome);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getHomeData()
      .then((result) => active && setData(result))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/*" element={<PublicRoutes data={data} loading={loading} error={error} />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
