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
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("checkInDate"), fromDate));
            }

            LocalDate toDate = filter.getToDate();
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("checkOutDate"), toDate));
            }

            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
