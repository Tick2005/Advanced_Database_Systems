package com.hotel.modules.branch.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class BranchCreateRequest {

    private String parentBranchId;

    @NotBlank
    private String code;

    @NotBlank
    private String name;

    @NotBlank
    private String country;

    @NotBlank
    private String city;

    @NotBlank
    private String address;

    private String phone;

    @Email
    private String email;

    private String timezone = "Asia/Ho_Chi_Minh";

    public String getParentBranchId() {
        return parentBranchId;
    }

    public void setParentBranchId(String parentBranchId) {
        this.parentBranchId = parentBranchId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }
}