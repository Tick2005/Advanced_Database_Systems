# SUBMISSION PREPARATION FINAL CHECKLIST

Dựa trên **CS-402 Final Project Rubric**, đây là những gì cần hoàn thành để đạt điểm cao.

---

## 📋 RUBRIC SCORE MAPPING (Group = 85%, Individual = 15%)

### Group Score Breakdown (85%)

| Tiêu Chí | Trọng Số | Hiện Tại | Target | Status |
|---|---|---|---|---|
| **Design & Architecture** | 35% | 6/10 | 8.5/10 | 🔴 Cần fix |
| **Technical Execution** | 35% | 5.5/10 | 8.5/10 | 🔴 Cần fix |
| **Report Quality** | 15% | 0/10 | 8.0/10 | 🔴 Chưa có |
| **Group Total** | 100% | **5.2/10** | **8.33/10** | |

**Current Projection**: 5.2/10 (F) ❌ **WILL FAIL**
**Target Projection**: 8.33/10 (A-) ✅ **PASS WELL**

---

## 🚀 QUICK WINS (Do This Week)

### **P0: Completed ✅**
```
✓ V11: Unique index on payment.transaction_ref
✓ V12: Exclusion constraint on booking overlap
✓ BookingService: @Retryable on state transitions
✓ PaymentService: @Retryable on payment update
✓ Concurrent booking test (2-thread race)
✓ Test results: 9/9 pass
```

### **P1: Completed ✅**
```
✓ V13: Outbox + Saga + Event Store migrations
✓ OutboxEvent, SagaInstance, SagaStepResult entities
✓ SagaOrchestrator (create, execute, compensate)
✓ OutboxPoller (poll, publish, retry)
✓ OutboxPublisher (Postgres→MongoDB bridge)
✓ CrossStoreConsistencyL2Test (7 scenarios)
```

### **P2: Code Cleanup (Do This) ⏳**
```
- [ ] PaymentService: Extract PaymentMethod enum
- [ ] OutboxPoller: Extract constants to OutboxPollerConfig
- [ ] BookingService: Add event emission via BookingEventEmitter
- [ ] Add input validation (@NotNull, @Validated)
- [ ] Split OutboxPoller into 4 task classes
- [ ] Add CircuitBreaker pattern for MongoDB
```

### **P3: Documentation (Do This) ⏳**
```
- [ ] Write Individual Technical Defense (1-2 pages per student)
- [ ] Create README.md with Docker commands
- [ ] Create architecture diagram (event flow, saga flow)
- [ ] Create AI Audit Trail with all prompts
- [ ] Claim code ownership (file paths + line numbers)
```

---

## 📄 WHAT RUBRIC EXPECTS TO SEE

### **Design & Architecture (35%)**

**Rubric Asks**:
> "Optimal split between SQL/NoSQL. Correct use of Normalization vs Embedding."

**Your Answer Should Show**:
```
1. Why Postgres for bookings + payments:
   - ACID guarantees (booking must be atomic)
   - Pessimistic locking prevents race conditions
   - Stored functions for complex state transitions
   
2. Why MongoDB for feedback + stats:
   - Eventually consistent (feedback can be stale by 200ms)
   - Schema flexibility (feedback structure can evolve)
   - Denormalized (optimized for reads, not writes)
   
3. How they talk to each other:
   - Outbox pattern: Event published atomically with booking
   - OutboxPoller: Asynchronously pushes to MongoDB
   - At-least-once delivery: No events lost
```

**How to Prove It**:
- Create ERD showing Postgres normalization (3NF)
- Create MongoDB collection schema showing denormalization
- Draw architecture diagram: Postgres → Outbox → MongoDB
- Write 1-page explanation in report

---

### **Technical Execution (35%)**

**Rubric Asks**:
> "Functional implementation of Triggers, Recursive CTEs, and Sagas/2PC"

**Your Answer Should Show**:

✅ **Triggers**: `fn_hold_room_booking()`, `fn_confirm_room_booking()`
```
Select these functions in report, explain:
- Why: Atomicity (room hold + booking transition in 1 function)
- How: Pessimistic lock + status check + transaction
- Used: By BookingService via StoredProcedureQuery
```

✅ **Recursive CTE**: V9 has staff hierarchy
```
SELECT staff_id, name, manager_id, level
FROM staff
WHERE manager_id IS NULL

UNION ALL

SELECT s.staff_id, s.name, s.manager_id, p.level + 1
FROM staff s
JOIN (previous query) p ON s.manager_id = p.staff_id
```

✅ **Sagas**: P1 implementation (SagaOrchestrator)
```
- State machine: PENDING → IN_PROGRESS → COMPLETED/COMPENSATING
- Automatic compensation on failure
- Each step tracks compensation data for undo
```

✅ **2PC Equivalent**: Outbox pattern
```
- Postgres: Booking state + Event both in same transaction
- Commit = both or nothing
- Then async publish to MongoDB (eventual consistency)
```

**How to Prove It**:
- List file paths and code snippets in Technical Defense
- Explain purpose of each
- Show test case that validates it works

---

### **Report Quality (15%)**

**Rubric Asks**:
> "Clear diagrams, professional flow, and transparent AI prompt documentation."

**You Must Create**:

1. **Business Analysis (Group - 1-2 pages)**
   ```
   - What is the system? (Hotel booking)
   - Who uses it? (Guests, staff, managers)
   - What are the key flows? (Booking → Payment → Feedback)
   - Why polyglot? (Flexibility + Scale)
   ```

2. **System Architecture Diagram (Group)**
   ```
   Frontend (React)
       ↓
   Backend (Spring Boot)
       ├─ Bookings service (ACID)
       ├─ Payments service (Pessimistic locking)
       ├─ Outbox table (Event sourcing)
       └─ OutboxPoller (Async publish)
           ↓
   Postgres (ACID transactions)
       ↓
   MongoDB (Eventual consistency)
       ├─ feedback_events
       ├─ payment_events
       └─ booking_events
   ```

3. **Database ERD (Group)**
   ```
   Show Postgres tables with relationships
   Show MongoDB collections
   Explain denormalization strategy
   ```

4. **Individual Technical Defense (Per Student - 1-2 pages)**
   ```
   1. Code Ownership
      - "I wrote PaymentService.java lines 31-199"
      - "I wrote OutboxPoller.java lines 50-350"
   
   2. Design Justification
      - "Why pessimistic locking?"
      - "Why Outbox pattern?"
   
   3. Complex Code Walkthrough
      - Show saga compensation logic
      - Explain LIFO execution order
      - Trace example: BookingConfirmed saga fails at step 2
   
   4. AI Critical Review
      - "AI generated: @Getter @Setter annotations"
      - "I found: Lombok not processing"
      - "I fixed: Manual getters/setters"
   ```

5. **AI Audit Trail (Appendix)**
   ```
   Prompt 1: "Design Postgres schema..."
   Output: [Initial schema]
   Verification: ✅ Correct
   
   Prompt 2: "Implement Saga pattern..."
   Output: [SagaOrchestrator code]
   Verification: ⚠️ Fixed LIFO compensation order
   ```

---

## 🎤 LIVE DEFENSE PREPARATION

### Questions You Will Get (Prepare Answers!)

**Question 1**: "Show your most complex code. Explain line-by-line."
```
Answer: Show Saga.compensate() method
- Line 72: Get successful steps (filter stream)
- Line 78: Reverse iterate (i-- from end)
- Line 82: Get compensation data (JSON parse)
- Line 87: Call handler.compensate() (execute undo)
Complexity: O(N) where N = saga steps
Safe: Yes, only scheduler calls this
```

**Question 2**: "Why Pessimistic Locking instead of Optimistic?"
```
Answer: 
- Optimistic: Works if low contention (< 5% write conflicts)
- Pessimistic: Works if high contention (> 10% write conflicts)
- VNPay callbacks can duplicate → high contention
- Pessimistic simpler for this scenario
```

**Question 3**: "If MongoDB is down, what happens?"
```
Answer:
- Booking saved to Postgres ✓
- Event inserted into outbox ✓
- OutboxPoller can't publish (MongoDB down)
- Event.published = false
- OutboxPoller retries every 2 seconds
- After 3 failed attempts → moved to DLQ
- Operator alerted
- Once MongoDB fixed → can replay from DLQ
```

**Question 4**: "Modify your code live: Add logging to compensate()"
```
Answer: Can add log statement without hesitation
for (int i = successful.size() - 1; i >= 0; i--) {
    log.info("Compensating step {}/{}: {}", 
        i+1, successful.size(), step.getStepName());  // ← Added
    compensate(step);
}
```

---

## ✅ FINAL BEFORE-SUBMISSION CHECKLIST

### Code (All must PASS)
- [ ] `mvn clean compile -DskipTests` → SUCCESS
- [ ] `mvn clean verify` → 100% tests pass
- [ ] No compiler warnings
- [ ] No critical SpotBugs findings
- [ ] No security vulnerabilities

### Documentation
- [ ] README.md with Docker commands ✓
- [ ] Architecture diagram created ✓
- [ ] ERD created ✓
- [ ] Individual Technical Defense written (per student) ✓
- [ ] AI Audit Trail documented ✓
- [ ] Code ownership claimed ✓

### Testing
- [ ] 9/9 L1 tests pass ✓
- [ ] 7/7 Cross-store tests pass ✓
- [ ] At least 1 concurrency test ✓
- [ ] At least 1 chaos test (MongoDB down) ⏳
- [ ] Coverage > 70% on critical modules ✓

### Ownership (Per Student)
- [ ] Can explain why pessimistic locking ✓
- [ ] Can explain why Saga/Outbox ✓
- [ ] Can trace through complex code ✓
- [ ] Can identify what AI got wrong ✓
- [ ] Can modify code live ✓

---

## 📊 SCORE PREDICTION

### If You Do ALL Tasks Above:

```
Design & Architecture:     8.5/10
  ✓ Polyglot SQL+NoSQL
  ✓ Correct normalization vs embedding
  ✓ Idempotency patterns
  
Technical Execution:       8.5/10
  ✓ Triggers functional
  ✓ CTE recursive
  ✓ Saga with compensation
  ✓ Comprehensive tests
  
Report Quality:            8.0/10
  ✓ Diagrams clear
  ✓ AI audit trail
  ✓ Professional
  
Group Total:               8.33/10 × 0.85 = 7.08/10

Individual Defense:        7.5/10 (varies per student)
  ✓ Code ownership
  ✓ Design justification
  ? Live modification demo (50/50)
  
Individual:                7.5/10 × 0.15 = 1.13/10

FINAL GRADE:               7.08 + 1.13 = 8.21/10 (A)  ✅
```

---

## 🎯 PRIORITY ORDER (Do In This Sequence)

### Week 1 (This Week)
1. [ ] Complete P0 (already done ✓)
2. [ ] Complete P1 (already done ✓)
3. [ ] Start P2 Code Cleanup:
   - [ ] PaymentService enum (30 min)
   - [ ] OutboxPollerConfig (30 min)
   - [ ] BookingEventEmitter (30 min)

### Week 2
4. [ ] Finish P2 cleanup (1.5 hours)
5. [ ] Add chaos tests (1 hour)
6. [ ] Run full verification: `mvn clean verify` (30 min)

### Week 3
7. [ ] Write Individual Technical Defense (1-2 hours per student)
8. [ ] Create README.md + diagrams (1 hour)
9. [ ] Create AI Audit Trail (30 min)
10. [ ] Package final ZIP

### Week 4 (Before Deadline)
11. [ ] Practice live defense
12. [ ] Final code review
13. [ ] Submit!

---

## 🚨 RED FLAGS (Will Cause Failure)

- ❌ Code doesn't compile: `mvn clean compile` fails
- ❌ Tests fail: `mvn verify` < 50% pass rate
- ❌ Student can't explain their code during defense
- ❌ Student copy-pastes AI code without verification
- ❌ Missing report sections (no AI audit trail, no diagrams)
- ❌ Missing code ownership (who wrote what?)
- ❌ No event emission from services (Outbox never gets events)
- ❌ Saga compensation logic broken (FIFO instead of LIFO)

---

## 💡 TIPS FOR DEFENSE

**What Professors Care About**:
1. **You Understand Your Code**: Can explain why, not just how
2. **You Verified AI Output**: Show where you fixed bugs
3. **You Thought About Tradeoffs**: "I chose X over Y because..."
4. **You Can Code Live**: Modify your code without hints
5. **You Document Everything**: AI prompts, design decisions, ownership

**What Professors Don't Care About**:
- ❌ Perfect code style (close is fine)
- ❌ Fancy UI (simple is OK as long as functional)
- ❌ Bells and whistles (focus on ACID/polyglot concepts)

---

## 📞 QUESTIONS? 

Refer to:
- `FINAL_SUBMISSION_GUIDE.md` - Detailed rubric mapping
- `CODE_CLEANUP_CHECKLIST.md` - Code quality fixes
- `P1_SAGA_OUTBOX_IMPLEMENTATION.md` - Architecture deep-dive

---

**DEADLINE**: 2 weeks
**STATUS**: Currently 5.2/10 (will fail if submitted now) 🔴
**TARGET**: 8.21/10 (A grade) 🟢
**ACTION**: Start P2 cleanup TODAY! ⏰

