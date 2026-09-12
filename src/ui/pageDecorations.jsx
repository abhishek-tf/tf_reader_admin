/**
 * The faint line-art each Stitch screen draws behind its own page banner — a different motif
 * per screen, not one piece of art reused everywhere. Each one lives in its own file under
 * `pageDecorations/` (this file got too long once every migrated screen had one), purely
 * decorative and `aria-hidden` wherever it's used. Re-exported here so every existing import
 * (`from '../ui/pageDecorations.jsx'`) keeps working unchanged.
 */
export { default as PublishersDecoration } from './pageDecorations/PublishersDecoration.jsx';
export { default as BooksDecoration } from './pageDecorations/BooksDecoration.jsx';
export { default as InstitutionsDecoration } from './pageDecorations/InstitutionsDecoration.jsx';
export { default as ShelvesDecoration } from './pageDecorations/ShelvesDecoration.jsx';
export { default as EntitlementsDecoration } from './pageDecorations/EntitlementsDecoration.jsx';
export { default as OperatorsAuditDecoration } from './pageDecorations/OperatorsAuditDecoration.jsx';
export { default as DashboardDecoration } from './pageDecorations/DashboardDecoration.jsx';
export { default as LoginDecoration } from './pageDecorations/LoginDecoration.jsx';
