package com.planify.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class UserFavoriteId implements Serializable {

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "location_id")
    private Long locationId;
}
