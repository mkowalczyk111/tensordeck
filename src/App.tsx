import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { AnimatePresence, motion } from 'framer-motion';
import { createM3Theme } from './theme';
import { useFlashcardStore } from './hooks/useFlashcardStore';
import type { FlashcardStore } from './hooks/useFlashcardStore';
import { DashboardPage } from './pages/DashboardPage';
import { StudyPage } from './pages/StudyPage';
import { BrowsePage } from './pages/BrowsePage';
import { ImportPage } from './pages/ImportPage';
import { SettingsPage } from './pages/SettingsPage';
import { StatsPage } from './pages/StatsPage';
import { AppSettingsPage } from './pages/AppSettingsPage';

export type PageId = 'dashboard' | 'study' | 'browse' | 'import' | 'settings' | 'stats' | 'app-settings';
export interface NavState { page: PageId; params: Record<string, string>; }

interface NavContextType {
  nav: NavState;
  navigate: (page: PageId, params?: Record<string, string>) => void;
  goBack: () => void;
  store: FlashcardStore;
  themePref: 'light' | 'dark' | 'system';
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  ttsRate: number;
  setTtsRate: (r: number) => void;
}

export const NavContext = createContext<NavContextType>(null!);
export const useNav = () => useContext(NavContext);

function AppContent() {
  const navigateRouter = useNavigate();
  const params = useParams();
  const location = useLocation();

  const [themePref, setThemePref] = useState<'light' | 'dark' | 'system'>('system');
  const [ttsRate, setTtsRate] = useState(1.0);
  const store = useFlashcardStore();

  const [systemDark, setSystemDark] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const themeMode: 'light' | 'dark' = themePref === 'system' ? (systemDark ? 'dark' : 'light') : themePref;
  const theme = useMemo(() => createM3Theme(themeMode), [themeMode]);

  const pageId = useMemo((): PageId => {
    const path = location.pathname;
    if (path.startsWith('/study/')) return 'study';
    if (path.startsWith('/browse/')) return 'browse';
    if (path.startsWith('/settings/')) return 'settings';
    if (path === '/import') return 'import';
    if (path === '/stats') return 'stats';
    if (path === '/app-settings') return 'app-settings';
    return 'dashboard';
  }, [location.pathname]);

  const nav = useMemo((): NavState => {
    return {
      page: pageId,
      params: (params as Record<string, string>) || {},
    };
  }, [pageId, params]);

  const navigate = useCallback((page: PageId, navigateParams: Record<string, string> = {}) => {
    let path = '/';
    switch (page) {
      case 'dashboard': path = '/'; break;
      case 'study': path = `/study/${navigateParams.groupId || ''}`; break;
      case 'browse': path = `/browse/${navigateParams.groupId || ''}`; break;
      case 'settings': path = `/settings/${navigateParams.groupId || ''}`; break;
      case 'import': path = '/import'; break;
      case 'stats': path = '/stats'; break;
      case 'app-settings': path = '/app-settings'; break;
    }
    navigateRouter(path);
  }, [navigateRouter]);

  const goBack = useCallback(() => {
    navigateRouter(-1);
  }, [navigateRouter]);

  const ctx = useMemo<NavContextType>(() => ({
    nav, navigate, goBack, store, themePref, themeMode,
    setThemeMode: setThemePref, ttsRate, setTtsRate,
  }), [nav, navigate, goBack, store, themePref, themeMode, ttsRate]);

  return (
    <NavContext.Provider value={ctx}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
                >
                  <DashboardPage />
                </motion.div>
              } />
              <Route path="/study/:groupId" element={
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
                >
                  <StudyPage />
                </motion.div>
              } />
              <Route path="/browse/:groupId" element={
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
                >
                  <BrowsePage />
                </motion.div>
              } />
              <Route path="/settings/:groupId" element={
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
                >
                  <SettingsPage />
                </motion.div>
              } />
              <Route path="/import" element={
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
                >
                  <ImportPage />
                </motion.div>
              } />
              <Route path="/stats" element={
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
                >
                  <StatsPage />
                </motion.div>
              } />
              <Route path="/app-settings" element={
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
                >
                  <AppSettingsPage />
                </motion.div>
              } />
              <Route path="*" element={
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
                >
                  <DashboardPage />
                </motion.div>
              } />
            </Routes>
          </AnimatePresence>
        </Box>
      </ThemeProvider>
    </NavContext.Provider>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
