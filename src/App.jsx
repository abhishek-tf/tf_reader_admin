import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layout/AppLayout.jsx';
import RequireAuth from './auth/RequireAuth.jsx';
import { ENTRIES, homeRouteForRole } from './layout/SideMenu.jsx';
import { useAuth } from './auth/AuthContext.jsx';
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
import CollectionItemsScreen from './screens/CollectionItemsScreen.jsx';
import OperatorsScreen from './screens/OperatorsScreen.jsx';
import OperatorFormScreen from './screens/OperatorFormScreen.jsx';
import AuditLogsScreen from './screens/AuditLogsScreen.jsx';
import NotFound from './screens/NotFound.jsx';

// Which roles may use each route group, read from the same table SideMenu builds its links
// from. One source of truth: a role that cannot see a link in the menu cannot reach it by
// typing the address either, and there is nothing here to keep in sync by hand.
function rolesFor(path) {
  return ENTRIES.find((entry) => entry.to === path)?.roles ?? null;
}

const PUBLISHER_ROLES = rolesFor('/publishers');
const BOOK_ROLES = rolesFor('/books');
const INSTITUTION_ROLES = rolesFor('/institutions');
const SHELF_ROLES = rolesFor('/shelves');
const ENTITLEMENT_ROLES = rolesFor('/entitlements');
const OPERATOR_ROLES = rolesFor('/operators');
const AUDIT_ROLES = rolesFor('/audit');

/**
 * Resolves "/" to the signed-in operator's own landing page, instead of the fixed
 * /publishers every role used to be sent to regardless of whether it could use it.
 *
 * Rendered inside RequireAuth, so `user` is always set by the time this runs.
 */
function RoleHome() {
  const { user } = useAuth();
  return <Navigate to={homeRouteForRole(user.role)} replace />;
}

/**
 * Every address in the console.
 *
 * /login is the only page outside the guard. Everything else sits inside RequireAuth, which
 * sends a signed-out visitor to /login. Guarding the layout rather than each page means a new
 * screen is protected the moment it is added, with nothing to remember.
 *
 * Each protected route is also wrapped in its own RequireAuth with a `roles` list, so a
 * signed-in operator whose role is not allowed on that route gets NotAuthorized rather than
 * the page itself. The outer RequireAuth has already confirmed signed-in and not-restoring by
 * the time these run, so each inner check only ever has the role to decide on.
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
        <Route path="/" element={<RoleHome />} />

        <Route
          path="/institutions"
          element={
            <RequireAuth roles={INSTITUTION_ROLES}>
              <InstitutionsScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/institutions/new"
          element={
            <RequireAuth roles={INSTITUTION_ROLES}>
              <InstitutionFormScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/institutions/:institutionId/edit"
          element={
            <RequireAuth roles={INSTITUTION_ROLES}>
              <InstitutionFormScreen />
            </RequireAuth>
          }
        />

        <Route
          path="/books"
          element={
            <RequireAuth roles={BOOK_ROLES}>
              <BooksScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/books/new"
          element={
            <RequireAuth roles={BOOK_ROLES}>
              <BookFormScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/books/:itemId/edit"
          element={
            <RequireAuth roles={BOOK_ROLES}>
              <BookFormScreen />
            </RequireAuth>
          }
        />

        <Route
          path="/shelves"
          element={
            <RequireAuth roles={SHELF_ROLES}>
              <ShelvesScreen />
            </RequireAuth>
          }
        />

        <Route
          path="/entitlements"
          element={
            <RequireAuth roles={ENTITLEMENT_ROLES}>
              <EntitlementsScreen />
            </RequireAuth>
          }
        />

        <Route
          path="/publishers"
          element={
            <RequireAuth roles={PUBLISHER_ROLES}>
              <PublishersScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/publishers/new"
          element={
            <RequireAuth roles={PUBLISHER_ROLES}>
              <PublisherForm backTo="/publishers" backLabel="Back to publishers" />
            </RequireAuth>
          }
        />
        <Route
          path="/publishers/:publisherId"
          element={
            <RequireAuth roles={PUBLISHER_ROLES}>
              <PublisherDetailScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/publishers/:publisherId/edit"
          element={
            <RequireAuth roles={PUBLISHER_ROLES}>
              <PublisherEditScreen />
            </RequireAuth>
          }
        />
        {/* Create only. There is no endpoint for editing a collection's name or code. */}
        <Route
          path="/publishers/:publisherId/collections/new"
          element={
            <RequireAuth roles={PUBLISHER_ROLES}>
              <CollectionFormScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/publishers/:publisherId/collections/:collectionId/items"
          element={
            <RequireAuth roles={PUBLISHER_ROLES}>
              <CollectionItemsScreen />
            </RequireAuth>
          }
        />

        <Route
          path="/operators"
          element={
            <RequireAuth roles={OPERATOR_ROLES}>
              <OperatorsScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/operators/new"
          element={
            <RequireAuth roles={OPERATOR_ROLES}>
              <OperatorFormScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/operators/:adminUserId/edit"
          element={
            <RequireAuth roles={OPERATOR_ROLES}>
              <OperatorFormScreen />
            </RequireAuth>
          }
        />

        <Route
          path="/audit"
          element={
            <RequireAuth roles={AUDIT_ROLES}>
              <AuditLogsScreen />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* A safety net. If the guarded block ever fails to match, do not render a blank page. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
