import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layout/AppLayout.jsx';
import RequireAuth from './auth/RequireAuth.jsx';
import LoginScreen from './screens/LoginScreen.jsx';
import BooksScreen from './screens/BooksScreen.jsx';
import BookFormScreen from './screens/BookFormScreen.jsx';
import ShelvesScreen from './screens/ShelvesScreen.jsx';
import EntitlementsScreen from './screens/EntitlementsScreen.jsx';
import InstitutionsScreen from './screens/InstitutionsScreen.jsx';
import InstitutionFormScreen from './screens/InstitutionFormScreen.jsx';
import PublishersScreen from './screens/PublishersScreen.jsx';
import PublisherForm from './screens/PublisherForm.jsx';
import PublisherEditScreen from './screens/PublisherEditScreen.jsx';
import PublisherDetailScreen from './screens/PublisherDetailScreen.jsx';
import CollectionFormScreen from './screens/CollectionFormScreen.jsx';
import OperatorsScreen from './screens/OperatorsScreen.jsx';
import OperatorFormScreen from './screens/OperatorFormScreen.jsx';
import AuditLogsScreen from './screens/AuditLogsScreen.jsx';
import NotFound from './screens/NotFound.jsx';

/**
 * Every address in the console.
 *
 * /login is the only page outside the guard. Everything else sits inside RequireAuth, which
 * sends a signed-out visitor to /login. Guarding the layout rather than each page means a new
 * screen is protected the moment it is added, with nothing to remember.
 *
 * Every create and edit form has an address of its own, rather than appearing at the bottom of
 * a list. `/publishers/new` renders PublisherForm directly because there is nothing to load
 * first. An edit screen normally fetches its own record, so a reload works — except
 * /operators, where the contract has no endpoint to fetch one admin user by id.
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
        <Route path="/institutions/new" element={<InstitutionFormScreen />} />
        <Route path="/institutions/:institutionId/edit" element={<InstitutionFormScreen />} />

        <Route path="/books" element={<BooksScreen />} />
        <Route path="/books/new" element={<BookFormScreen />} />
        <Route path="/books/:itemId/edit" element={<BookFormScreen />} />

        <Route path="/shelves" element={<ShelvesScreen />} />

        <Route path="/entitlements" element={<EntitlementsScreen />} />

        <Route path="/publishers" element={<PublishersScreen />} />
        <Route
          path="/publishers/new"
          element={<PublisherForm backTo="/publishers" backLabel="Back to publishers" />}
        />
        <Route path="/publishers/:publisherId" element={<PublisherDetailScreen />} />
        <Route path="/publishers/:publisherId/edit" element={<PublisherEditScreen />} />
        {/* Create only. There is no endpoint for editing a collection's name or code. */}
        <Route path="/publishers/:publisherId/collections/new" element={<CollectionFormScreen />} />

        <Route path="/operators" element={<OperatorsScreen />} />
        <Route path="/operators/new" element={<OperatorFormScreen />} />
        <Route path="/operators/:adminUserId/edit" element={<OperatorFormScreen />} />

        <Route path="/audit" element={<AuditLogsScreen />} />

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* A safety net. If the guarded block ever fails to match, do not render a blank page. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
