# API contract digest

**GENERATED FILE. Do not edit.** In the admin repo, copy it from the backend repo after the
contract changes:

```bash
cp ../tf_reader_backend_temp/.claude/context/api-contract-digest.md .claude/context/
```

Generated 2026-08-14 from `wokay-api.yaml`.

44 operations across 32 paths, 81 schemas. **`FROZEN` means another team is already building against it: changing one needs a cohort conversation.**

## Admin

**This is the console's whole surface.** Everything else is for the reader app.

| | Path | Stability |
|---|---|---|
| POST | `/api/admin/v1/auth/login` | FROZEN |
| POST | `/api/admin/v1/auth/refresh` | DRAFT |
| POST | `/api/admin/v1/auth/logout` | DRAFT |
| GET | `/api/admin/v1/auth/me` | FROZEN |
| GET | `/api/admin/v1/publishers` | DRAFT |
| POST | `/api/admin/v1/publishers` | DRAFT |
| GET | `/api/admin/v1/publishers/{publisherId}` | DRAFT |
| PUT | `/api/admin/v1/publishers/{publisherId}` | DRAFT |
| PATCH | `/api/admin/v1/publishers/{publisherId}/status` | DRAFT |
| GET | `/api/admin/v1/publishers/{publisherId}/collections` | DRAFT |
| POST | `/api/admin/v1/publishers/{publisherId}/collections` | DRAFT |
| PUT | `/api/admin/v1/collections/{collectionId}/items` | DRAFT |
| GET | `/api/admin/v1/catalogue-items` | DRAFT |
| POST | `/api/admin/v1/catalogue-items` | DRAFT |
| GET | `/api/admin/v1/catalogue-items/{itemId}` | DRAFT |
| PUT | `/api/admin/v1/catalogue-items/{itemId}` | DRAFT |
| POST | `/api/admin/v1/catalogue-items/{itemId}/content` | DRAFT |
| GET | `/api/admin/v1/catalogue-items/{itemId}/ingest-status` | DRAFT |
| GET | `/api/admin/v1/institutions` | DRAFT |
| POST | `/api/admin/v1/institutions` | DRAFT |
| GET | `/api/admin/v1/institutions/{institutionId}` | DRAFT |
| PUT | `/api/admin/v1/institutions/{institutionId}` | DRAFT |
| PATCH | `/api/admin/v1/institutions/{institutionId}/status` | DRAFT |
| GET | `/api/admin/v1/institutions/{institutionId}/entitlements` | DRAFT |
| POST | `/api/admin/v1/institutions/{institutionId}/entitlements` | DRAFT |
| PUT | `/api/admin/v1/entitlements/{entitlementId}` | DRAFT |
| DELETE | `/api/admin/v1/entitlements/{entitlementId}` | DRAFT |
| GET | `/api/admin/v1/institutions/{institutionId}/feed-settings` | DRAFT |
| PUT | `/api/admin/v1/institutions/{institutionId}/feed-settings` | DRAFT |
| GET | `/api/admin/v1/admin-users` | DRAFT |
| POST | `/api/admin/v1/admin-users` | DRAFT |
| PUT | `/api/admin/v1/admin-users/{adminUserId}` | DRAFT |
| DELETE | `/api/admin/v1/admin-users/{adminUserId}` | DRAFT |
| GET | `/api/admin/v1/audit-logs` | DRAFT |

## Public institutions


| | Path | Stability |
|---|---|---|
| GET | `/api/v1/institutions` | FROZEN |
| GET | `/api/v1/institutions/{institutionId}` | FROZEN |

## OPDS institution


| | Path | Stability |
|---|---|---|
| GET | `/opds/v1/institutions/{institutionId}/catalogue` | FROZEN |
| GET | `/opds/v1/institutions/{institutionId}/groups/{groupId}` | FROZEN |
| GET | `/opds/v1/institutions/{institutionId}/search` | FROZEN |
| GET | `/opds/v1/institutions/{institutionId}/publications/{itemId}` | FROZEN |

## OPDS public


| | Path | Stability |
|---|---|---|
| GET | `/opds/v1/public/catalogue` | FROZEN |
| GET | `/opds/v1/public/search` | DRAFT |
| GET | `/opds/v1/public/publications/{itemId}` | DRAFT |

## App


| | Path | Stability |
|---|---|---|
| POST | `/api/v1/catalogue/items:batch` | FROZEN |

## Enums a screen switches on

- **`AccessTier`**: OPEN_ACCESS, SUBSCRIPTION, ELITE
- **`ItemStatus`**: DRAFT, PUBLISHED, ARCHIVED
- **`ContentState`**: NONE, QUEUED, PROCESSING, READY, FAILED
- **`AdminRole`**: SUPER_ADMIN, PUBLISHER_ADMIN, INSTITUTION_ADMIN
- **`EntitlementScope`**: PUBLISHER, COLLECTION, ITEM
- **`EntitlementStatus`**: ACTIVE, SUSPENDED, REVOKED
- **`SortOrder`**: publishedAt.desc, publishedAt.asc, title.asc, title.desc
- **`ContentType`**: PDF, EPUB, AUDIO
- **`Intent`**: STREAM, DOWNLOAD
- **`RecordStatus`**: ACTIVE, SUSPENDED, RETIRED
- **`InstitutionType`**: UNIVERSITY, COLLEGE, LIBRARY, CORPORATE

## Error codes, all of them

`UNAUTHENTICATED`, `FORBIDDEN_SCOPE`, `FORBIDDEN_INSTITUTION_MISMATCH`, `NO_ENTITLEMENT`, `CONTENT_NOT_READY`, `DOWNLOAD_NOT_PERMITTED`, `NOT_FOUND`, `CODE_TAKEN`, `TOO_MANY_IDS`, `VALIDATION_FAILED`, `STALE_VERSION`

Switch on `code`, never on `message`. There are no spare codes, so do not write a handler
for one that is not in this list. `src/api/errors.js` mirrors this list exactly.

## Two shapes every screen meets

```
page:   { items: [...], page: 0, size: 20, total: 84 }        page is ZERO based
error:  { timestamp, status, code, message, path, traceId }   show the traceId
```

## Schemas

`Error`, `ErrorCode`, `PageMeta`, `RecordStatus`, `SortOrder`, `Isbn`, `ContentType`, `AssetFormat`, `AccessTier`, `ItemStatus`, `EntitlementScope`, `EntitlementStatus`, `Intent`, `InstitutionType`, `AdminRole`, `ContentState`, `StatusChange`, `InstitutionSummary`, `InstitutionPage`, `Branding`, `SignIn`, `SignInWrite`, `InstitutionDetail`, `OpdsLink`, `OpdsNavigationLink`, `OpdsPublicationLink`, `OpdsImageLink`, `OpdsLinkProperties`, `EncryptedInfo`, `OpdsFeedMetadata`, `OpdsGroupMetadata`, `OpdsNavigationFeed`, `OpdsPublicationFeed`, `OpdsGroup`, `OpdsPublicationDocument`, `OpdsPublication`, `OpdsContributor`, `OpdsPublicationMetadata`, `BatchItemsRequest`, `BatchItem`, `BatchItemsResponse`, `ContentGrantRequest`, `SubjectRef`, `LoanProof`, `SignedUrl`, `IndexUrl`, `Encryption`, `ContentGrant`, `AdminLoginRequest`, `TokenPair`, `AdminLoginResponse`, `RefreshResponse`, `RefreshRequest`, `AdminSession`, `AdminUser`, `AdminUserPage`, `AdminUserCreate`, `AdminUserUpdate`, `Publisher`, `PublisherWrite`, `PublisherPage`, `Collection`, `CollectionPage`, `CollectionWrite`, `Asset`, `CatalogueItem`, `CatalogueItemWrite`, `CatalogueItemPage`, `IngestStatus`, `AdminInstitution`, `AdminInstitutionPage`, `InstitutionWrite`, `Entitlement`, `EntitlementPage`, `EntitlementCreate`, `EntitlementUpdate`, `Shelf`, `FeedSettings`, `FeedSettingsWrite`, `AuditLog`, `AuditLogPage`

## When this is not enough

Read the relevant part of `wokay-api.yaml` in the docs repo. **Do not read the whole file**:
it is about 147 KB, and a targeted grep is always cheaper.
