# Shared

Shared types and constants for backend and frontend.

## Types (`types/`)

- **ApiResponse** — `ApiSuccessResponse`, `ApiErrorResponse`, `PaginationMeta`, `ApiPaginatedResponse`
- **User** — `User`, `AgencyRef`
- **Agency** — `Agency`

To use from frontend or backend, add a path alias in your `tsconfig` (e.g. `"@shared/*": ["../shared/*"]`) or import by relative path. Keep these in sync with backend API and Prisma when you change shapes.
