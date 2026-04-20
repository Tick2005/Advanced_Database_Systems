# CODE CLEANUP CHECKLIST & REFACTORING PRIORITIES

## 🔍 Quick Audit: Code Quality Issues Found

### **Severity: CRITICAL (Must fix before submission)**

```
Issue 1: Inconsistent error handling across services
  File: PaymentService.java, BookingService.java
  Problem: Different retry policies, missing @Transactional
  Fix: Standardize @Retryable decorator
  Impact: If not fixed → unpredictable behavior under load
  
Issue 2: Magic numbers scattered throughout
  Files: OutboxPoller.java (100ms, 2000ms, 3 retries)
  Problem: Hardcoded constants make tuning difficult
  Fix: Extract to configuration class
  Impact: If not fixed → report mentions "unprofessional"
  
Issue 3: No centralized exception handling
  Files: Multiple services
  Problem: Each service catches exceptions separately
  Fix: Create @RestControllerAdvice for consistent error responses
  Impact: If not fixed → API responses inconsistent

Issue 4: Missing input validation on critical paths
  Files: BookingService.confirmBooking(), PaymentService.createPayment()
  Problem: No null checks or business rule validation
  Fix: Add @Validated + @NotNull annotations
  Impact: If not fixed → potential NPE in production
```

---

## 📋 REFACTORING CHECKLIST BY MODULE

### **Module 1: PaymentService.java**

#### Current Issues:
```java
// ❌ Issue 1: Inconsistent null checking
public PaymentEntity createPayment(UUID bookingId, String method) {
    Booking booking = bookingRepository.findById(bookingId).orElseThrow();  // ✓ Good
    // ... but later methods don't check this way
}

// ❌ Issue 2: Repeated try-catch for same exceptions
try { ... } catch (CannotAcquireLockException e) { ... }
try { ... } catch (CannotAcquireLockException e) { ... }  // Duplicate!

// ❌ Issue 3: Magic strings for payment methods
if ("VNPAY".equals(method)) { ... }
if ("CREDIT_CARD".equals(method)) { ... }

// ❌ Issue 4: Missing @Transactional on public methods
public PaymentEntity createPayment(...) {  // Should be @Transactional
    ...
}
```

#### Fixes to Apply:
```java
// ✅ Fix 1: Use enum instead of string
public enum PaymentMethod {
    VNPAY("VNPAY"),
    CREDIT_CARD("CREDIT_CARD");
    
    public final String value;
    PaymentMethod(String value) { this.value = value; }
}

// ✅ Fix 2: Use @Transactional + @Retryable together
@Transactional
@Retryable(retryFor = {
    CannotAcquireLockException.class,
    PessimisticLockingFailureException.class,
    ConcurrencyFailureException.class,
    TransientDataAccessException.class
}, maxAttempts = 3, backoff = @Backoff(delay = 120, multiplier = 2.0))
public PaymentEntity createPayment(UUID bookingId, PaymentMethod method) {
    // Exceptions now caught once in @Retryable
    ...
}

// ✅ Fix 3: Input validation
@Transactional
@Retryable(...)
public PaymentEntity createPayment(
    @NotNull(message = "bookingId cannot be null") UUID bookingId,
    @NotNull(message = "method cannot be null") PaymentMethod method) {
    
    Booking booking = bookingRepository.findById(bookingId)
        .orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));
    
    if (booking.getStatus() != BookingStatus.HOLD) {
        throw new BusinessException("Cannot create payment for non-HOLD booking");
    }
    ...
}
```

#### Time to Fix: **30 minutes**
- [ ] Extract PaymentMethod enum
- [ ] Add input validation
- [ ] Add @Transactional where missing
- [ ] Run tests to verify no regressions

---

### **Module 2: OutboxPoller.java**

#### Current Issues:
```java
// ❌ Issue 1: Magic numbers without explanation
@Scheduled(fixedRate = 100, initialDelay = 500)        // Why 100ms? Why 500ms?
@Scheduled(fixedRate = 2000)                           // Why 2000ms?
@Scheduled(cron = "0 0 2 * * *")                       // 2 AM? Why not 3 AM?

// ❌ Issue 2: Oversized class (350+ lines)
public class OutboxPoller {
    pollAndPublishOutbox() { ... }                     // 50 lines
    publishEvent() { ... }                             // 40 lines
    publishFailedButRetryable() { ... }                // 40 lines
    moveDeadLetteredEventsToDLQ() { ... }              // 50 lines
    cleanupPublishedEvents() { ... }                   // 30 lines
    alertDeadLettered() { ... }                        // 40 lines
    getMetrics() { ... }                               // 20 lines
}

// ❌ Issue 3: String magic for operations
if ("MongoDB publish failed, will retry".equals(...)) { ... }  // Hardcoded message

// ❌ Issue 4: No circuit breaker for MongoDB failure
// If MongoDB is permanently down, keeps retrying forever
```

#### Fixes to Apply:

**Step 1: Extract Configuration Constants**
```java
public class OutboxPollerConfig {
    // Polling intervals (ms)
    public static final int POLL_INTERVAL_MS = 100;           // Poll every 100ms
    public static final int POLL_INITIAL_DELAY_MS = 500;      // Start after 500ms
    public static final int RETRY_INTERVAL_MS = 2000;         // Retry every 2s
    public static final int STALE_SAGA_CHECK_INTERVAL_MS = 30000;  // 30s
    
    // Timing thresholds (ms)
    public static final int DEADLOCK_TIMEOUT_MS = 5 * 60 * 1000;  // 5 minutes
    
    // Retry policy
    public static final int MAX_RETRIES = 3;
    public static final int INITIAL_BACKOFF_MS = 100;
    public static final double BACKOFF_MULTIPLIER = 2.0;
    
    // Cleanup policy (days)
    public static final int CLEANUP_PUBLISHED_OLDER_THAN_DAYS = 30;
    
    // DLQ processing
    public static final int DLQ_ALERT_THRESHOLD = 10;  // Alert if > 10 events in DLQ
}
```

**Step 2: Split into Multiple Classes**
```
OutboxPoller.java
├── OutboxPublishingTask (poll, publish, mark published)
├── OutboxRetryTask (retry failed events)
├── OutboxDeadLetterHandler (move to DLQ, alert)
└── OutboxCleanupTask (delete published events)
```

**Step 3: Add Circuit Breaker for MongoDB**
```java
@Service
public class OutboxPublishingTask {
    
    private final CircuitBreaker mongoCircuitBreaker;
    
    @Scheduled(fixedRateString = "#{T(com.hotel.config.OutboxPollerConfig).POLL_INTERVAL_MS}")
    public void publishEvents() {
        if (mongoCircuitBreaker.isOpen()) {
            log.warn("MongoDB circuit breaker OPEN - skipping publish");
            return;
        }
        
        try {
            List<OutboxEvent> events = outboxRepository.findUnpublished();
            for (OutboxEvent event : events) {
                publishEvent(event);
            }
        } catch (Exception e) {
            mongoCircuitBreaker.recordFailure();
            log.error("Publishing failed, circuit breaker updated", e);
        }
    }
}
```

#### Time to Fix: **1 hour**
- [ ] Extract OutboxPollerConfig class
- [ ] Split OutboxPoller into 4 task classes
- [ ] Add CircuitBreaker pattern
- [ ] Run tests to verify

---

### **Module 3: BookingService.java**

#### Current Issues:
```java
// ❌ Issue 1: No separation of concerns
public void confirmBooking(UUID bookingId) {
    // 1. Fetch & validate
    // 2. Update status
    // 3. Update room availability
    // 4. Update stats
    // 5. Emit event
    // All in one method!
}

// ❌ Issue 2: Missing event emission
@Transactional
@Retryable(...)
public void confirmBooking(UUID bookingId) {
    Booking booking = bookingRepository.findByIdForUpdate(bookingId);
    booking.setStatus(BookingStatus.CONFIRMED);
    bookingRepository.save(booking);
    // ❌ MISSING: outboxRepository.save(new OutboxEvent(...))
}

// ❌ Issue 3: No input validation
public void confirmBooking(UUID bookingId) {  // What if null?
    ...
}

// ❌ Issue 4: Hardcoded status values
if (booking.getStatus() != BookingStatus.HOLD) { ... }  // Good
// But other methods use string comparisons
```

#### Fixes to Apply:

**Step 1: Create Event Emission Methods**
```java
@Component
public class BookingEventEmitter {
    
    private final OutboxEventRepository outboxRepository;
    private final ObjectMapper objectMapper;
    
    public void emitBookingConfirmed(Booking booking) {
        OutboxEvent event = OutboxEvent.builder()
            .aggregateId(booking.getId())
            .aggregateType(OutboxEvent.AggregateType.BOOKING)
            .eventType("BookingConfirmed")
            .payload(objectMapper.writeValueAsString(Map.of(
                "bookingId", booking.getId(),
                "roomId", booking.getRoomId(),
                "checkInDate", booking.getCheckInDate()
            )))
            .build();
        
        outboxRepository.save(event);
    }
    
    public void emitBookingCancelled(Booking booking) {
        OutboxEvent event = OutboxEvent.builder()
            .aggregateId(booking.getId())
            .aggregateType(OutboxEvent.AggregateType.BOOKING)
            .eventType("BookingCancelled")
            .payload(...)
            .build();
        
        outboxRepository.save(event);
    }
}
```

**Step 2: Update Service with Event Emission**
```java
@Service
@Transactional
public class BookingService {
    
    private final BookingRepository bookingRepository;
    private final BookingEventEmitter eventEmitter;  // ← Inject
    
    @Retryable(...)
    public void confirmBooking(@NotNull UUID bookingId) {
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
            .orElseThrow(() -> new NotFoundException("Booking not found"));
        
        if (booking.getStatus() != BookingStatus.HOLD) {
            throw new BusinessException("Cannot confirm non-HOLD booking");
        }
        
        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);
        
        // ✅ EMIT EVENT in same transaction
        eventEmitter.emitBookingConfirmed(booking);
    }
}
```

#### Time to Fix: **45 minutes**
- [ ] Create BookingEventEmitter class
- [ ] Add event emission to confirmBooking
- [ ] Add similar emitters for cancel, checkin, checkout
- [ ] Update tests to verify events created
- [ ] Verify CrossStoreConsistencyL2Test still passes

---

### **Module 4: Test Suite**

#### Current Issues:
```java
// ✅ Good: BookingPaymentRoomFlowL1Test has comprehensive scenarios
// ✅ Good: concurrent booking test added

// ❌ Missing: Chaos testing (network failures, timeouts)
// ❌ Missing: Saga failure scenarios
// ❌ Missing: DLQ escalation testing
// ❌ Missing: Frontend interaction tests (if doing UI)
```

#### Fixes to Add:

**New Test: Chaos - MongoDB Down During Publishing**
```java
@Test
@DisplayName("Chaos: MongoDB down for 10s should queue events, recover on restart")
public void testMongoDBDownRecovery() throws Exception {
    // 1. Create booking event → outbox
    OutboxEvent event = createOutboxEvent();
    outboxRepository.save(event);
    
    // 2. Simulate MongoDB failure: Stop MongoDB container
    mongoContainer.stop();
    
    // 3. Poll several times (should fail, but queue events)
    for (int i = 0; i < 5; i++) {
        outboxPoller.pollAndPublishOutbox();
        Thread.sleep(100);
    }
    
    // 4. Assert: Event still unpublished, retryCount > 0
    OutboxEvent unpublished = outboxRepository.findById(event.getId()).orElseThrow();
    assertThat(unpublished.getPublished()).isFalse();
    assertThat(unpublished.getRetryCount()).isGreaterThan(0);
    
    // 5. Restart MongoDB
    mongoContainer.start();
    await().atMost(5, TimeUnit.SECONDS).until(() -> mongoContainer.isRunning());
    
    // 6. Poll again → should publish successfully
    outboxPoller.pollAndPublishOutbox();
    
    // 7. Assert: Event now published
    OutboxEvent published = outboxRepository.findById(event.getId()).orElseThrow();
    assertThat(published.getPublished()).isTrue();
}
```

**New Test: Saga Compensation Under Network Partition**
```java
@Test
@DisplayName("Saga: Network partition during step 2 should trigger compensation")
public void testSagaCompensationOnNetworkPartition() throws Exception {
    // Create saga with 3 steps
    SagaInstance saga = createSaga();
    
    // Execute step 1 successfully
    executeStep1(saga);  // Status: SUCCESS
    
    // Simulate network partition: Block MongoDB access
    mongoTemplate.setOperationTimeoutMs(100);  // Too short timeout
    
    // Execute step 2 (should timeout)
    try {
        executeStep2(saga);  // CREATE feedback
        fail("Should have timed out");
    } catch (MongoTimeoutException e) {
        // Expected
    }
    
    // Assert: Saga status = COMPENSATING
    SagaInstance compensating = sagaRepository.findById(saga.getSagaId()).orElseThrow();
    assertThat(compensating.getStatus()).isEqualTo(SagaStatus.COMPENSATING);
    
    // Trigger compensation
    sagaOrchestrator.compensate(compensating);
    
    // Assert: All successful steps undone
    SagaInstance compensated = sagaRepository.findById(saga.getSagaId()).orElseThrow();
    assertThat(compensated.getStatus()).isEqualTo(SagaStatus.ROLLED_BACK);
}
```

#### Time to Fix: **1 hour**
- [ ] Add chaos test for MongoDB recovery
- [ ] Add saga compensation under network partition
- [ ] Add DLQ escalation test
- [ ] Run all tests: `mvn clean verify`

---

## 🧹 OVERALL CODE CLEANUP COMMANDS

### **Run in sequence:**

```bash
# 1. Format code (if using spotless)
mvn spotless:apply

# 2. Find bugs
mvn spotbugs:check

# 3. Find code smells
mvn pmd:check

# 4. Check for security issues
mvn dependency-check:check

# 5. Full build with tests
mvn clean verify

# 6. Generate coverage report
mvn jacoco:report
# View: target/site/jacoco/index.html
```

---

## ✅ CHECKLIST: Ready for Submission?

**Code Quality:**
- [ ] All methods have JavaDoc (public methods)
- [ ] No @SuppressWarnings without explanation
- [ ] No System.out.println() calls
- [ ] No TODOs/FIXMEs left
- [ ] No magic numbers (extract to constants)
- [ ] No duplicate code (DRY)
- [ ] All public methods have input validation

**Testing:**
- [ ] `mvn clean verify` passes
- [ ] Coverage > 70% on critical modules
- [ ] At least 1 concurrency test per service
- [ ] At least 1 chaos test (network failure)
- [ ] All test names are descriptive

**Documentation:**
- [ ] README.md complete with examples
- [ ] JavaDoc for all public APIs
- [ ] Architecture diagram exists
- [ ] ERD exists
- [ ] Sequence diagram for key flows

**Individual Technical Defense (Per Student):**
- [ ] Code ownership claimed (files + lines)
- [ ] Design justification written
- [ ] Complex code walkthrough prepared
- [ ] AI critical review section done
- [ ] Can modify code live without hesitation

---

## 📊 TIME ESTIMATE

| Task | Time | Priority |
|------|------|----------|
| PaymentService fixes | 30 min | CRITICAL |
| OutboxPoller refactoring | 1 hour | CRITICAL |
| BookingService event emission | 45 min | HIGH |
| Test suite expansion | 1 hour | HIGH |
| Code quality checks | 30 min | MEDIUM |
| Documentation finalization | 1 hour | MEDIUM |
| **TOTAL** | **4.5 hours** | |

---

## 🎯 QUALITY GATES

Before submission, your code must pass:

```bash
# All must show PASS or GREEN
✓ mvn clean compile -DskipTests
✓ mvn clean verify (all tests pass)
✓ mvn jacoco:report (>70% coverage on critical modules)
✓ No Critical/Blocker bugs in spotbugs
✓ No Security vulnerabilities in dependency-check
```

If any gate fails → Cannot submit (will get 0)

---
