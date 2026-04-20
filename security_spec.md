# Security Specification for SmartStadium AI

## Data Invariants
1. A Zone density must be between 0 and 1.
2. Current count in a zone cannot exceed capacity by more than a reasonable buffer (e.g., 20% for emergency scenarios).
3. Alerts must have a valid type.
4. Only Admins can modify stadium state (Zones, Stalls, Alerts).
5. Attendees can only 'read' the data.

## The Dirty Dozen (Potential Attack Payloads)
1. **Unauthorized Write**: Non-admin trying to update Zone density.
2. **Density Overflow**: Setting density to 100 via update.
3. **Capacity Spoofing**: Setting capacity to a negative number.
4. **Invalid Stall Type**: Setting type to 'nuclear_bunker'.
5. **Admin Escape**: Trying to set `isAdmin` flag on a user profile (if we had profiles).
6. **Alert Spam**: Non-admin creating millions of 'emergency' alerts.
7. **Orphaned Write**: Creating a stall without location coordinates.
8. **ID Poisoning**: Injecting 2MB string as a document ID.
9. **Timestamp Spoofing**: Setting `createdAt` to 2077.
10. **Shadow Field**: Adding `isHacked: true` to a Zone document.
11. **Type Inconsistency**: Sending a string for `queueSize`.
12. **Malicious Alert**: Emergency alert with message `<script>alert(1)</script>`.

## Tests
We will verify that these payloads are rejected by the rules.
