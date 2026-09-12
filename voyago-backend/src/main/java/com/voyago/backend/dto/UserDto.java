package com.voyago.backend.dto;

import com.voyago.backend.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String mobile;
    private Role role;
    private boolean verified;
    private LocalDateTime createdAt;
}
