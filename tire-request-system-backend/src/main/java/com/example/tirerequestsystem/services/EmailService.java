package com.example.tirerequestsystem.services;

import com.example.tirerequestsystem.models.TireRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String mailFrom;

    @Value("${app.base-url}")
    private String appBaseUrl;

    @Value("${file.upload-dir}")
    private String uploadDir;

    private static final String LOGO_PATH = "static/images/logo.png";
    private static final String LOGO_CID = "logoImage";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private String createHtmlEmailFrame(String title, String content) {
        return "<!DOCTYPE html><html><head><title>" + title + "</title>" +
               "<style>" +
               "body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; color: #333; }" +
               ".container { background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); max-width: 600px; margin: auto; }" +
               ".header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eeeeee; }" +
               ".header img { max-width: 150px; }" +
               ".content { padding: 20px 0; line-height: 1.6; }" +
               ".button-container { text-align: center; padding-top: 20px; }" +
               ".button { background-color: #007bff; color: white !important; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 0 5px; display: inline-block; }" +
               ".button-reject { background-color: #dc3545; }" +
               "table { width: 100%; border-collapse: collapse; margin-top: 15px; }" +
               "th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }" +
               "th { background-color: #f2f2f2; }" +
               "</style></head><body>" +
               "<div class='container'>" +
               "<div class='header'><img src='cid:" + LOGO_CID + "' alt='Company Logo'></div>" +
               "<div class='content'>" + content + "</div>" +
               "</div></body></html>";
    }

    private String formatRequestDetailsAsHtmlTable(TireRequest request) {
        StringBuilder details = new StringBuilder("<h3>Tire Request Details:</h3>");
        details.append("<table>");
        details.append("<tr><td>Vehicle No:</td><td>").append(request.getVehicleNo() != null ? request.getVehicleNo() : "N/A").append("</td></tr>");
        details.append("<tr><td>Vehicle Type:</td><td>").append(request.getVehicleType() != null ? request.getVehicleType() : "N/A").append("</td></tr>");
        details.append("<tr><td>Brand:</td><td>").append(request.getVehicleBrand() != null ? request.getVehicleBrand() : "N/A").append("</td></tr>");
        details.append("<tr><td>Model:</td><td>").append(request.getVehicleModel() != null ? request.getVehicleModel() : "N/A").append("</td></tr>");
        details.append("<tr><td>Tire Size Required:</td><td>").append(request.getTireSizeRequired() != null ? request.getTireSizeRequired() : "N/A").append("</td></tr>");
        details.append("<tr><td>No. of Tires:</td><td>").append(request.getNoOfTiresRequired() != null ? request.getNoOfTiresRequired().toString() : "N/A").append("</td></tr>");
        details.append("<tr><td>Requested By:</td><td>").append(request.getRequestedByUsername() != null ? request.getRequestedByUsername() : "N/A").append("</td></tr>");
        details.append("<tr><td>Request Date:</td><td>").append(request.getRequestDate() != null ? request.getRequestDate().format(DATE_FORMATTER) : "N/A").append("</td></tr>");
        if (request.getComments() != null && !request.getComments().isEmpty()) {
             details.append("<tr><td>Comments:</td><td>").append(request.getComments()).append("</td></tr>");
        }
        details.append("</table>");
        return details.toString();
    }

    private void sendEmailInternal(String to, String subject, String htmlContent, List<String> attachmentFileNames) throws MessagingException {
        if (to == null || to.isBlank()) {
            System.err.println("Email not sent: Recipient address is null or empty. Subject: " + subject);
            return;
        }
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());
        helper.setTo(to);
        helper.setFrom(mailFrom);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        ClassPathResource logoResource = new ClassPathResource(LOGO_PATH);
        if (logoResource.exists()) {
             helper.addInline(LOGO_CID, logoResource);
        } else {
            System.err.println("Logo resource not found at: " + LOGO_PATH + ". Email will be sent without logo.");
        }
        if (attachmentFileNames != null && !attachmentFileNames.isEmpty()) {
            for (String fileName : attachmentFileNames) {
                if (fileName == null || fileName.isBlank()) continue;
                Path imagePath = Paths.get(uploadDir).resolve(fileName).normalize();
                File imageFile = imagePath.toFile();
                if (imageFile.exists() && imageFile.isFile()) {
                    FileSystemResource fileResource = new FileSystemResource(imageFile);
                    helper.addAttachment(fileResource.getFilename(), fileResource);
                } else {
                    System.err.println("Attachment file not found or is a directory: " + imagePath.toString());
                }
            }
        }
        mailSender.send(message);
        System.out.println("Email sent successfully to: " + to + " with subject: " + subject);
    }

    public void sendNewRequestEmailToManager(TireRequest request, String managerEmail) {
        try {
             String subject = "New Tire Request Submitted: Vehicle " + request.getVehicleNo();
             String approveUrl = appBaseUrl + "/api/requests/" + request.getId() + "/manager-approve";
             String rejectUrl = appBaseUrl + "/api/requests/" + request.getId() + "/manager-reject?remarks=RejectedFromEmail";
             String content = "<p>A new tire request has been submitted and requires your approval.</p>" +
                             formatRequestDetailsAsHtmlTable(request) +
                             "<div class='button-container'>" +
                             "<a href='" + approveUrl + "' class='button'>Approve Request</a>" +
                             "<a href='" + rejectUrl + "' class='button button-reject'>Reject Request</a>" +
                             "</div>";
             String htmlEmail = createHtmlEmailFrame("New Tire Request: " + request.getVehicleNo(), content);
             sendEmailInternal(managerEmail, subject, htmlEmail, request.getImagePaths());
        } catch (Exception e) {
             System.err.println("Error sending new request email to manager " + managerEmail + " for request ID " + request.getId() + ": " + e.getMessage());
        }
    }

    public void sendManagerApprovalEmailToTransportOfficer(TireRequest request, String transportOfficerEmail) {
         try {
             String subject = "Request Approved by Manager (Final Approval Needed): Vehicle " + request.getVehicleNo();
             String finalApproveUrl = appBaseUrl + "/api/requests/" + request.getId() + "/transport-approve";
             String finalRejectUrl = appBaseUrl + "/api/requests/" + request.getId() + "/transport-reject?remarks=RejectedFromEmail";
             String content = "<p>The tire request for vehicle <strong>" + request.getVehicleNo() +
                             "</strong> has been <strong>approved by the Manager</strong> and requires your final approval.</p>" +
                             formatRequestDetailsAsHtmlTable(request) +
                             "<p><strong>Manager Remarks:</strong> " + (request.getManagerRemarks() != null ? request.getManagerRemarks() : "N/A") + "</p>" +
                             "<div class='button-container'>" +
                             "<a href='" + finalApproveUrl + "' class='button'>Final Approve</a>" +
                             "<a href='" + finalRejectUrl + "' class='button button-reject'>Reject</a>" +
                             "</div>";
             String htmlEmail = createHtmlEmailFrame("Request Pending Final Approval: " + request.getVehicleNo(), content);
             sendEmailInternal(transportOfficerEmail, subject, htmlEmail, request.getImagePaths());
         } catch (Exception e) {
             System.err.println("Error sending manager approval email to TO " + transportOfficerEmail + " for request ID " + request.getId() + ": " + e.getMessage());
         }
    }

    public void sendFinalApprovalEmail(TireRequest request, String userEmail, String managerEmail) {
        try {
             String subject = "Tire Request Finally Approved: Vehicle " + request.getVehicleNo();
             String content = "<p>The tire request for vehicle <strong>" + request.getVehicleNo() + "</strong> has been <strong>finally approved</strong>.</p>" +
                             formatRequestDetailsAsHtmlTable(request) +
                             "<p><strong>Manager Remarks:</strong> " + (request.getManagerRemarks() != null ? request.getManagerRemarks() : "N/A") + "</p>" +
                             "<p><strong>Transport Officer Remarks:</strong> " + (request.getTransportOfficerRemarks() != null ? request.getTransportOfficerRemarks() : "N/A") + "</p>";
             String htmlEmail = createHtmlEmailFrame("Request Approved: " + request.getVehicleNo(), content);
             if (userEmail != null && !userEmail.isBlank()) {
                 sendEmailInternal(userEmail, subject, htmlEmail, request.getImagePaths());
             }
             if (managerEmail != null && !managerEmail.isBlank()) {
                 sendEmailInternal(managerEmail, "FYI: " + subject, htmlEmail, request.getImagePaths());
             }
        } catch (Exception e) {
            System.err.println("Error sending final approval email for request " + request.getId() + ": " + e.getMessage());
        }
    }

    public void sendRejectionEmail(TireRequest request, String userEmail, String rejectedByRole, String remarks) {
        try {
             String subject = "Tire Request Rejected: Vehicle " + request.getVehicleNo();
             String content = "<p>We regret to inform you that your tire request for vehicle <strong>" + request.getVehicleNo() +
                             "</strong> has been <strong>rejected</strong> by the " + rejectedByRole + ".</p>" +
                             formatRequestDetailsAsHtmlTable(request) +
                             "<p><strong>Reason for Rejection:</strong> " + (remarks != null ? remarks : "N/A") + "</p>";
             String htmlEmail = createHtmlEmailFrame("Request Rejected: " + request.getVehicleNo(), content);
             if (userEmail != null && !userEmail.isBlank()) {
                 sendEmailInternal(userEmail, subject, htmlEmail, request.getImagePaths());
             }
        } catch (Exception e) {
            System.err.println("Error sending rejection email to " + userEmail + " for request " + request.getId() + ": " + e.getMessage());
        }
    }
}
