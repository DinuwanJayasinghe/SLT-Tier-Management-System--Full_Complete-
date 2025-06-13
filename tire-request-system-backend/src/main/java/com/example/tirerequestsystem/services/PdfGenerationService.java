package com.example.tirerequestsystem.services;

import com.example.tirerequestsystem.models.TireRequest;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PdfGenerationService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    private static final PDType1Font FONT_BOLD = PDType1Font.HELVETICA_BOLD;
    private static final PDType1Font FONT_REGULAR = PDType1Font.HELVETICA;
    private static final float FONT_SIZE_TITLE = 18;
    private static final float FONT_SIZE_HEADING = 12;
    private static final float FONT_SIZE_TEXT = 10;
    private static final float LEADING_TITLE = 22;
    private static final float LEADING_HEADING = 16;
    private static final float LEADING_TEXT = 14;
    private static final float MARGIN = 50;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter DATE_ONLY_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");


    public byte[] generateTireRequestPdf(TireRequest request) throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            float yPosition = page.getMediaBox().getHeight() - MARGIN;
            float contentWidth = page.getMediaBox().getWidth() - 2 * MARGIN;

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                // Title
                contentStream.setFont(FONT_BOLD, FONT_SIZE_TITLE);
                contentStream.beginText();
                contentStream.newLineAtOffset(MARGIN, yPosition);
                contentStream.showText("Tire Request Details");
                contentStream.endText();
                yPosition -= LEADING_TITLE * 2;

                // Request Details Table
                yPosition = addDetailTable(contentStream, request, yPosition, contentWidth);

                // Images Section
                if (request.getImagePaths() != null && !request.getImagePaths().isEmpty()) {
                    yPosition -= LEADING_HEADING; // Space before images section title
                    if (yPosition < MARGIN + 100 && request.getImagePaths().size() > 0) { // Check if new page needed before images
                         contentStream.close();
                         page = new PDPage(PDRectangle.A4);
                         document.addPage(page);
                         yPosition = page.getMediaBox().getHeight() - MARGIN;
                         // contentStream = new PDPageContentStream(document, page); // This line creates a new stream, but we need to close the old one first.
                    }
                    // Re-open content stream on new page if necessary
                    try (PDPageContentStream imageContentStream = (document.getNumberOfPages() > 1 && contentStream.isClosed()) ? new PDPageContentStream(document, document.getPage(document.getNumberOfPages()-1), PDPageContentStream.AppendMode.APPEND, true, true) : contentStream) {
                        imageContentStream.setFont(FONT_BOLD, FONT_SIZE_HEADING);
                        imageContentStream.beginText();
                        imageContentStream.newLineAtOffset(MARGIN, yPosition);
                        imageContentStream.showText("Attached Images:");
                        imageContentStream.endText();
                        yPosition -= LEADING_HEADING;
                        yPosition = addImages(document, imageContentStream, request.getImagePaths(), yPosition, contentWidth);
                    }
                }
            }
            document.save(outputStream);
            return outputStream.toByteArray();
        }
    }

    private float addDetailTable(PDPageContentStream contentStream, TireRequest request, float yStart, float contentWidth) throws IOException {
        float yPosition = yStart;
        float rowHeight = LEADING_TEXT * 1.5f; // Increased row height for better readability

        String[][] details = {
            {"Vehicle Number:", request.getVehicleNo()},
            {"Vehicle Type:", request.getVehicleType()},
            {"Vehicle Brand:", request.getVehicleBrand()},
            {"Vehicle Model:", request.getVehicleModel()},
            {"User Section:", request.getUserSection()},
            {"Requested By:", request.getRequestedByUsername()},
            {"Request Date:", request.getRequestDate() != null ? request.getRequestDate().format(DATE_FORMATTER) : "N/A"},
            {"Status:", request.getStatus() != null ? request.getStatus().toString() : "N/A"},
            {"Tire Size Required:", request.getTireSizeRequired()},
            {"No. of Tires Required:", request.getNoOfTiresRequired() != null ? request.getNoOfTiresRequired().toString() : "N/A"},
            {"No. of Tubes Required:", request.getNoOfTubesRequired() != null ? request.getNoOfTubesRequired().toString() : "N/A"},
            {"Cost Center:", request.getCostCenter()},
            {"Present KM Reading:", request.getPresentKmReading() != null ? request.getPresentKmReading().toString() : "N/A"},
            {"KM at Previous Replacement:", request.getKmReadingAtPreviousTireReplacement() != null ? request.getKmReadingAtPreviousTireReplacement().toString() : "N/A"},
            {"Last Tire Replacement Date:", request.getLastTireReplacementDate() != null ? request.getLastTireReplacementDate().format(DATE_ONLY_FORMATTER) : "N/A"},
            {"Make of Existing Tire:", request.getMakeOfExistingTire()},
            {"Approving Officer Service No:", request.getApprovingOfficerServiceNo()},
            {"Tire Wear Indicator Appeared:", request.getTireWearIndicatorAppeared() != null ? (request.getTireWearIndicatorAppeared() ? "Yes" : "No") : "N/A"},
            {"Tire Wear Pattern:", request.getTireWearPattern()},
            {"Comments:", request.getComments()},
            {"Manager Remarks:", request.getManagerRemarks()},
            {"Transport Officer Remarks:", request.getTransportOfficerRemarks()}
        };

        for (String[] detail : details) {
            if (detail[1] == null || detail[1].isBlank() || detail[1].equalsIgnoreCase("N/A")) continue; // Skip empty/NA fields

            if (yPosition < MARGIN + rowHeight) { // Check for new page
                contentStream.close();
                PDPage newPage = new PDPage(PDRectangle.A4);
                // document.addPage(newPage); // This was causing the error, document is final here.
                throw new IOException("Content exceeds page limit, new page logic needs to be handled by caller or by adding page to document before closing stream.");
                // yPosition = newPage.getMediaBox().getHeight() - MARGIN;
                // contentStream = new PDPageContentStream(document, newPage); // This is problematic if document is final.
            }

            contentStream.setFont(FONT_BOLD, FONT_SIZE_TEXT);
            contentStream.beginText();
            contentStream.newLineAtOffset(MARGIN, yPosition);
            contentStream.showText(detail[0]);
            contentStream.endText();

            contentStream.setFont(FONT_REGULAR, FONT_SIZE_TEXT);
            // Multi-line handling for value (basic)
            float textWidth = FONT_REGULAR.getStringWidth(detail[1]) / 1000 * FONT_SIZE_TEXT;
            float availableWidth = contentWidth - MARGIN - 120; // 120 is approx label width + padding

            List<String> lines = splitTextToLines(detail[1], availableWidth, FONT_REGULAR, FONT_SIZE_TEXT);
            float valueXOffset = MARGIN + 130; // X position for the value

            for (int i = 0; i < lines.size(); i++) {
                 if (yPosition < MARGIN + (i > 0 ? LEADING_TEXT : 0) ) { // Check for new page for subsequent lines
                    contentStream.close();
                    throw new IOException("Content exceeds page limit during multi-line value.");
                 }
                contentStream.beginText();
                contentStream.newLineAtOffset(valueXOffset, yPosition - (i * LEADING_TEXT));
                contentStream.showText(lines.get(i));
                contentStream.endText();
            }
            yPosition -= (lines.size() * LEADING_TEXT + (LEADING_TEXT * 0.5f)); // Adjust yPosition based on lines written
        }
        return yPosition;
    }

    private List<String> splitTextToLines(String text, float maxWidth, PDType1Font font, float fontSize) throws IOException {
        List<String> lines = new ArrayList<>();
        if (text == null || text.isEmpty()) {
            lines.add("");
            return lines;
        }
        String[] words = text.split(" ");
        StringBuilder currentLine = new StringBuilder();
        for (String word : words) {
            float width = font.getStringWidth(currentLine.toString() + (currentLine.length() > 0 ? " " : "") + word) / 1000 * fontSize;
            if (width <= maxWidth) {
                if (currentLine.length() > 0) currentLine.append(" ");
                currentLine.append(word);
            } else {
                lines.add(currentLine.toString());
                currentLine = new StringBuilder(word);
                 // Handle very long words that exceed maxWidth by themselves
                if (font.getStringWidth(word) / 1000 * fontSize > maxWidth) {
                    // Basic split for oversized words, can be improved
                    String remainingWord = word;
                    while(font.getStringWidth(remainingWord) / 1000 * fontSize > maxWidth) {
                        int k;
                        for(k=1; k < remainingWord.length(); k++){
                            if(font.getStringWidth(remainingWord.substring(0, k)) / 1000 * fontSize > maxWidth) {
                                lines.add(remainingWord.substring(0, k-1));
                                remainingWord = remainingWord.substring(k-1);
                                currentLine = new StringBuilder(remainingWord); // Reset currentLine with the start of the new oversized part
                                break;
                            }
                        }
                        if (k == remainingWord.length()) break; // word fits
                    }
                }
            }
        }
        if (currentLine.length() > 0) {
            lines.add(currentLine.toString());
        }
        return lines;
    }


    private float addImages(PDDocument document, PDPageContentStream contentStream, List<String> imagePaths, float yStart, float contentWidth) throws IOException {
        float yPosition = yStart;
        float imageWidth = (contentWidth / 2) - 10; // Two images per row with some padding
        float imageHeight = 150; // Fixed height for images

        for (int i = 0; i < imagePaths.size(); i++) {
            Path imageFile = Paths.get(uploadDir, imagePaths.get(i));
            if (Files.exists(imageFile)) {
                if (yPosition < MARGIN + imageHeight) { // Check for new page
                    contentStream.close(); // Close current stream before creating new page and stream
                    PDPage newPage = new PDPage(PDRectangle.A4);
                    document.addPage(newPage);
                    yPosition = newPage.getMediaBox().getHeight() - MARGIN;
                    // This line was problematic, a new stream should be created by the caller or handled carefully
                    // For this structure, it's better to ensure enough space or handle page creation more globally if possible.
                    // For now, let's assume the caller will manage the stream on a new page if this method signals it.
                    // However, PDFBox often requires one stream per page, or careful append mode.
                    // The current fix is to re-open it in the calling method.
                     throw new IOException("Image content exceeds page limit, new page logic needs to be handled by caller.");
                }

                PDImageXObject pdImage = PDImageXObject.createFromFile(imageFile.toString(), document);
                float xOffset = MARGIN + ((i % 2) * (imageWidth + 20)); // 20 for padding between images

                // Scale image to fit imageHeight while maintaining aspect ratio
                float originalWidth = pdImage.getWidth();
                float originalHeight = pdImage.getHeight();
                float scaledWidth = (imageHeight / originalHeight) * originalWidth;
                if (scaledWidth > imageWidth) { // If scaled width is too large, scale by width instead
                    scaledWidth = imageWidth;
                    imageHeight = (imageWidth / originalWidth) * originalHeight; // Recalculate height
                } else {
                     imageWidth = scaledWidth; // Adjust imageWidth to actual scaled width
                }


                contentStream.drawImage(pdImage, xOffset, yPosition - imageHeight, imageWidth, imageHeight);

                if (i % 2 == 1 || i == imagePaths.size() - 1) { // After two images or if it's the last image
                    yPosition -= (imageHeight + 10); // Move to next row, 10 for padding
                }
            }
        }
        return yPosition;
    }
}
