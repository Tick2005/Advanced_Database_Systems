package com.hotel.modules.room;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface RoomTypeRepository extends JpaRepository<RoomTypeEntity, UUID> {

    List<RoomTypeEntity> findByBranchId(UUID branchId);

    List<RoomTypeEntity> findByIdIn(Collection<UUID> ids);
}
