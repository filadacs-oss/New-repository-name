# Security Specification - Nexus Personal Assistant

## Data Invariants
1. All documents must belong to a `userId` that matches the authenticated user's UID.
2. Timestamps must be valid ISO strings and `createdAt`/`updatedAt` (if used) must be server timestamps.
3. Flight prices must be non-negative.
4. Calendar event `endTime` must be after `startTime`.

## The "Dirty Dozen" Payloads (to be blocked)
1. Creating an email with someone else's `userId`.
2. Updating an email's `userId` to a different user.
3. Deleting another user's calendar event.
4. Injecting 1MB of junk into an email `subject`.
5. Booking a flight with a negative `price`.
6. Setting a flight `status` to an invalid value like "stolen".
7. Creating a calendar event where `startTime` is after `endTime`.
8. Accessing the `/emails` collection without being signed in.
9. Listing all user emails without filtering by `userId`.
10. Spoofing an admin role to read private information.
11. Updating an email's `timestamp` to a future date manually.
12. Creating a flight search result without required fields like `origin`.

## Test Runner
(Tests will be executed via ESLint and internal validation helpers)
