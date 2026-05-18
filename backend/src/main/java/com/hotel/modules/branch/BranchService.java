package com.hotel.modules.branch;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hotel.exception.NotFoundException;
import com.hotel.modules.branch.dto.BranchCreateRequest;
import com.hotel.modules.branch.dto.BranchResponse;
import com.hotel.modules.branch.dto.BranchUpdateRequest;

@Service
public class BranchService {

    private final BranchRepository branchRepository;
    private final BranchMapper branchMapper;

    public BranchService(BranchRepository branchRepository, BranchMapper branchMapper) {
        this.branchRepository = branchRepository;
        this.branchMapper = branchMapper;
    }

    @SuppressWarnings("null")
    @Transactional
    public BranchResponse createBranch(BranchCreateRequest request) {
        BranchEntity entity = branchMapper.toEntity(request);
        return branchMapper.toResponse(branchRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<BranchResponse> getActiveBranches() {
        return branchRepository.findByActiveTrueOrderByCreatedAtDesc().stream().map(branchMapper::toResponse).toList();
    }

    @SuppressWarnings("null")
    @Transactional(readOnly = true)
    public BranchResponse getBranch(String id) {
        BranchEntity entity = branchRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NotFoundException("Branch not found: " + id));
        return branchMapper.toResponse(entity);
    }

    @SuppressWarnings("null")
    @Transactional
    public BranchResponse updateBranch(String id, BranchUpdateRequest request) {
        BranchEntity entity = branchRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NotFoundException("Branch not found: " + id));

        if (request.getName() != null) {
            entity.setName(request.getName());
        }
        if (request.getCountry() != null) {
            entity.setCountry(request.getCountry());
        }
        if (request.getCity() != null) {
            entity.setCity(request.getCity());
        }
        if (request.getAddress() != null) {
            entity.setAddress(request.getAddress());
        }
        if (request.getPhone() != null) {
            entity.setPhone(request.getPhone());
        }
        if (request.getEmail() != null) {
            entity.setEmail(request.getEmail());
        }
        if (request.getTimezone() != null) {
            entity.setTimezone(request.getTimezone());
        }
        if (request.getActive() != null) {
            entity.setActive(request.getActive());
        }

        return branchMapper.toResponse(branchRepository.save(entity));
    }

    @SuppressWarnings("null")
    @Transactional
    public boolean deleteBranch(String id) {
        BranchEntity entity = branchRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NotFoundException("Branch not found: " + id));
        // Soft-delete: set active=false to preserve referential integrity with bookings/rooms
        entity.setActive(false);
        branchRepository.save(entity);
        return true;
    }
}