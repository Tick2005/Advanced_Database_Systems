package com.hotel.modules.booking;

import com.hotel.common.enums.BookingStatus;
import com.hotel.modules.booking.dto.BookingFilterRequest;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class BookingSpecifications {

    private BookingSpecifications() {
    }

    /**
     * Booking cần xử lý hôm nay: đang active (checkIn <= today <= checkOut)
     * với status CONFIRMED hoặc CHECKED_IN, thuộc branch của staff.
     */
    public static Specification<BookingEntity> todayActiveByBranch(String branchId, LocalDate today) {
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("branchId"), UUID.fromString(branchId)));
            predicates.add(cb.lessThanOrEqualTo(root.get("checkInDate"), today));
            predicates.add(cb.greaterThanOrEqualTo(root.get("checkOutDate"), today));
            predicates.add(root.get("status").in(
                List.of(BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN)
            ));
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    public static Specification<BookingEntity> byFilter(BookingFilterRequest filter) {
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            if (filter == null) {
                return cb.conjunction();
            }

            if (hasText(filter.getCustomerId())) {
                predicates.add(cb.equal(root.get("customerId"), UUID.fromString(filter.getCustomerId())));
            }
            if (hasText(filter.getBranchId())) {
                predicates.add(cb.equal(root.get("branchId"), UUID.fromString(filter.getBranchId())));
            }
            if (hasText(filter.getStatus())) {
                predicates.add(cb.equal(root.get("status"), BookingStatus.valueOf(filter.getStatus().toUpperCase())));
            }

            LocalDate fromDate = filter.getFromDate();
            LocalDate toDate = filter.getToDate();

            if (fromDate != null && toDate != null && fromDate.equals(toDate)) {
                // "Today" query: lấy booking đang active trong ngày đó
                // checkInDate <= date AND checkOutDate >= date
                predicates.add(cb.lessThanOrEqualTo(root.get("checkInDate"), fromDate));
                predicates.add(cb.greaterThanOrEqualTo(root.get("checkOutDate"), toDate));
            } else {
                if (fromDate != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("checkInDate"), fromDate));
                }
                if (toDate != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("checkOutDate"), toDate));
                }
            }

            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
