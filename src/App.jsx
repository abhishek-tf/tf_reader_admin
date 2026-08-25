import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layout/AppLayout.jsx';
import RequireAuth from './auth/RequireAuth.jsx';
import LoginScreen from './screens/LoginScreen.jsx';
import BooksScreen from './screens/BooksScreen.jsx';
import ShelvesScreen from './screens/ShelvesScreen.jsx';
import InstitutionsScreen from './screens/InstitutionsScreen.jsx';
import FrameCheck from './screens/FrameCheck.jsx';
import PublishersScreen from './screens/PublishersScreen.jsx';
import PublisherForm from './screens/PublisherForm.jsx';
import PublisherDetailScreen from './screens/PublisherDetailScreen.jsx';
import NotFound from './screens/NotFound.jsx';

/**
 * Every address in the console.
 *
 * /login is the only page outside the guard. Everything else sits inside RequireAuth, which
 * sends a signed-out visitor to /login. Guarding the layout rather than each page means a new
 * screen is protected the moment it is added, with nothing to remember.
 *
 * The screens themselves do not exist yet. As each one lands it becomes another <Route>
 * inside this block, and the side menu entry loses its `soon` flag.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/publishers" replace />} />
        <Route path="/institutions" element={<InstitutionsScreen />} />
        <Route path="/books" element={<BooksScreen />} />
        <Route path="/shelves" element={<ShelvesScreen />} />
        <Route path="/frame-check" element={<FrameCheck />} />
        <Route path="/publishers" element={<PublishersScreen />} />
        <Route path="/publishers/new" element={<PublisherForm />} />
        <Route path="/publishers/:publisherId" element={<PublisherDetailScreen />} />

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* A safety net. If the guarded block ever fails to match, do not render a blank page. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
