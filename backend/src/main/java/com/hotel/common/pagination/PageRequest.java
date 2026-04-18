package com.hotel.common.pagination;

import java.util.HashMap;
import java.util.Map;

public class PageRequest {

    private String requestId;
    private Map<String, Object> payload = new HashMap<>();

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public Map<String, Object> getPayload() {
        return payload;
    }

    public void setPayload(Map<String, Object> payload) {
        this.payload = payload;
    }
}