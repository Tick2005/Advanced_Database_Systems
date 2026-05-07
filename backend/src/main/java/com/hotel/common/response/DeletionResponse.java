package com.hotel.common.response;

public class DeletionResponse {

    private String id;
    private boolean deleted;

    public DeletionResponse() {
    }

    public DeletionResponse(String id, boolean deleted) {
        this.id = id;
        this.deleted = deleted;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }
}
