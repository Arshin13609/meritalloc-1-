# Security Specification — MeritAlloc

## 1. Data Invariants
1. **Owner-Only PII Isolation**: `/users/{userId}` holds private email addresses and is strictly readable (`get` only; `list` is denied) and writable by `request.auth.uid == userId`.
2. **Student Profile Ownership & Sanitization**: `/studentProfiles/{studentId}` must have `studentId == request.auth.uid` and `data.uid == request.auth.uid`. Profiles never store PII (`email`, `phone`, `address`). List queries are strictly bounded by `resource.data.isPublished == true || resource.data.uid == request.auth.uid`.
3. **Recruiter Posting Ownership**: `/internships/{internshipId}` requires `incoming().recruiterId == request.auth.uid` on create, and `existing().recruiterId == request.auth.uid` with immutable `recruiterId` and `createdAt` on update and delete.
4. **Evaluation Relational Integrity**: `/capabilityEvaluations/{evaluationId}` must reference an existing `/studentProfiles/{studentId}` and `/internships/{internshipId}` whose `recruiterId` matches `incoming().recruiterId`. Only the owning student (`studentId`) or posting recruiter (`recruiterId`) may read or write evaluations, and only the posting recruiter may transition `allocationStatus` to `'Shortlisted'` or `'Allocated'`.
5. **Bounded Arrays & Strings**: Every string field enforces `.size()` limits, every ID enforces `^[a-zA-Z0-9_\\-]+$` (`<= 128`), and every array (`skills`, `requiredSkills`, `matchedSkills`, `missingSkills`) enforces `.size() <= MAX` plus first-element type validation.
6. **Temporal Integrity**: `createdAt` and `updatedAt` must equal `request.time` on creation; `updatedAt` must equal `request.time` and `createdAt` must remain immutable on update.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Cross-User PII Read**: Authenticated User B attempts `get` on `/users/userA` -> `PERMISSION_DENIED`.
2. **User Collection Enumeration**: Authenticated User A attempts `list` on `/users` -> `PERMISSION_DENIED`.
3. **Ghost Field Injection (Shadow Update)**: Student A attempts to add `isAdmin: true` or `verifiedBadge: true` to `/studentProfiles/userA` -> `PERMISSION_DENIED`.
4. **Identity Spoofing on Profile Create**: User A attempts to create `/studentProfiles/userB` with `uid: "userB"` -> `PERMISSION_DENIED`.
5. **Unverified Email Write**: Authenticated user with `email_verified: false` attempts to write `/internships/int1` -> `PERMISSION_DENIED`.
6. **Recruiter Hijack Update**: Recruiter B attempts to update `title` or `seats` on `/internships/intOwnedByA` -> `PERMISSION_DENIED`.
7. **Immutable Field Mutation**: Student A attempts to alter `createdAt` or `uid` on `/studentProfiles/userA` -> `PERMISSION_DENIED`.
8. **Client-Spoofed Timestamp**: Recruiter A sends a backdated `createdAt` timestamp instead of `request.time` -> `PERMISSION_DENIED`.
9. **ID Poisoning / Oversized Document ID**: User A attempts to create `/internships/` with a 300-character or `$invalid!` ID -> `PERMISSION_DENIED`.
10. **Array Exhaustion ("Denial of Wallet")**: Student A submits 500 items in `skills` array -> `PERMISSION_DENIED`.
11. **Orphaned Evaluation Spoofing**: User C (neither the student nor the recruiter) attempts to create `/capabilityEvaluations/userA__int1` -> `PERMISSION_DENIED`.
12. **Student Self-Allocation Escalation**: Student A attempts to set `allocationStatus: 'Allocated'` on `/capabilityEvaluations/userA__int1` -> `PERMISSION_DENIED`.
