package com.healclaim.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class S3Service {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.s3.presign-expiry-minutes}")
    private long expiryMinutes;

    // Generate a pre-signed PUT URL for direct frontend upload
    public String generatePresignedPutUrl(String s3Key, String contentType) {
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(expiryMinutes))
                .putObjectRequest(putRequest)
                .build();

        PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(presignRequest);
        return presigned.url().toString();
    }

    // Generate a pre-signed GET URL for viewing documents
    public String generatePresignedGetUrl(String s3Key) {
        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(expiryMinutes))
                .getObjectRequest(getRequest)
                .build();

        PresignedGetObjectRequest presigned = s3Presigner.presignGetObject(presignRequest);
        return presigned.url().toString();
    }

    // Delete an object from S3
    public void deleteObject(String s3Key) {
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .build());
    }
}