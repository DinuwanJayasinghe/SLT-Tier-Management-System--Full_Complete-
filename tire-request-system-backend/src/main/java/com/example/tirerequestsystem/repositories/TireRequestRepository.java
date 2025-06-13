package com.example.tirerequestsystem.repositories;

import com.example.tirerequestsystem.models.TireRequest;
import com.example.tirerequestsystem.models.ApprovalStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface TireRequestRepository extends MongoRepository<TireRequest, String> {
    Optional<TireRequest> findByVehicleNo(String vehicleNo);
    List<TireRequest> findByStatus(ApprovalStatus status);
    List<TireRequest> findByRequestedByUserId(String userId);
    List<TireRequest> findByStatusIn(List<ApprovalStatus> statuses);
}
