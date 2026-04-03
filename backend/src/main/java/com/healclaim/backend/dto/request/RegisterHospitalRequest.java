package com.healclaim.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterHospitalRequest {
    @NotBlank @Email
    private String email;
    @NotBlank @Size(min = 8)
    private String password;
    @NotBlank
    private String hospitalName;
    @NotBlank
    private String registrationNo;
    @NotBlank
    private String address;
}