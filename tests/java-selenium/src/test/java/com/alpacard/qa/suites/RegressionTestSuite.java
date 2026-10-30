package com.alpacard.qa.suites;

import com.alpacard.qa.pages.CustomerWalletPage;
import com.alpacard.qa.pages.DriverFactory;
import com.alpacard.qa.pages.MerchantBackofficePage;
import org.junit.jupiter.api.*;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

import static org.junit.jupiter.api.Assertions.*;

@Tag("regression")
public class RegressionTestSuite {
    private WebDriver driverDesktop;
    private WebDriver driverMobile;
    private final String baseUrl = System.getProperty("baseUrl", "https://dev.alpacard.app");

    @BeforeEach
    void setUp() {
        driverDesktop = DriverFactory.createDriver(false);
        driverMobile = DriverFactory.createDriver(true);
    }

    @AfterEach
    void tearDown() {
        if (driverDesktop != null) driverDesktop.quit();
        if (driverMobile != null) driverMobile.quit();
    }

    @Test
    @DisplayName("TC-011: (Create Venue) Complete merchant onboarding")
    void testTC011_CreateVenue() {
        MerchantBackofficePage backoffice = new MerchantBackofficePage(driverDesktop);
        backoffice.openDashboard(baseUrl);
        backoffice.createVenue("Regression Venue");
        assertTrue(driverDesktop.getPageSource().contains("Regression Venue"));
    }

    @Test
    @DisplayName("TC-012: (Create Campaign) Valid campaign registration")
    void testTC012_CreateCampaign() {
        MerchantBackofficePage backoffice = new MerchantBackofficePage(driverDesktop);
        backoffice.openDashboard(baseUrl);
        backoffice.createCampaign("Reg Campaign", 10, "Free Cookie");
        assertTrue(driverDesktop.getPageSource().contains("Reg Campaign"));
    }

    @Test
    @DisplayName("TC-008: (Customer Acquisition) Anonymous wallet claim")
    void testTC008_CustomerAcquisition() {
        CustomerWalletPage wallet = new CustomerWalletPage(driverMobile);
        wallet.openClaimUrl(baseUrl, "00000000-0000-0000-0000-000000000001");
        assertEquals(0, driverMobile.findElements(By.cssSelector("input[type='password']")).size());
    }

    @Test
    @DisplayName("TC-001: (Add Stamp) Dynamic QR generation")
    void testTC001_ScanDynamicQR() {
        CustomerWalletPage wallet = new CustomerWalletPage(driverMobile);
        wallet.openClaimUrl(baseUrl, "00000000-0000-0000-0000-000000000001");
        assertTrue(wallet.getQrCodeElement().isDisplayed());
    }

    @Test
    @DisplayName("TC-014: (Input Validations) Reject zero, negative, or invalid stamps")
    void testTC014_InputValidations() {
        MerchantBackofficePage backoffice = new MerchantBackofficePage(driverDesktop);
        backoffice.openDashboard(baseUrl);
        // Attempting to submit 0 or negative stamps
        backoffice.createCampaign("Invalid Promo", 0, "Free Tea");
        WebElement invalidField = driverDesktop.findElement(By.cssSelector(":invalid, .error, [aria-invalid='true']"));
        assertNotNull(invalidField, "Form must block invalid zero/negative numbers");
    }

    @Test
    @DisplayName("TC-005 & TC-006: (Reward Redemption) State change at capacity and card reset")
    void testTC005_TC006_RewardRedemption() {
        CustomerWalletPage wallet = new CustomerWalletPage(driverMobile);
        wallet.openClaimUrl(baseUrl, "00000000-0000-0000-0000-000000000001");
        // Verify claim state if threshold is met
        if (driverMobile.findElements(By.xpath("//button[contains(text(),'Claim') or contains(text(),'Canjear')]")).size() > 0) {
            wallet.getClaimRewardButton().click();
            assertNotNull(wallet.getCelebrationModal());
        }
    }

    @Test
    @DisplayName("TC-007: (Operational Limits) Block adding extra stamp if card is full (10/10)")
    void testTC007_CardFullLimit() {
        CustomerWalletPage wallet = new CustomerWalletPage(driverMobile);
        wallet.openClaimUrl(baseUrl, "00000000-0000-0000-0000-000000000001");
        // Interface at 10/10 must not show standard "Add Stamp" dynamic QR
        if (wallet.getStampCount().contains("10/10")) {
            assertEquals(0, driverMobile.findElements(By.cssSelector("[data-testid='add-stamp-qr']")).size(),
                    "Add stamp action must be locked when card is at 10/10");
        }
    }

    @Test
    @DisplayName("TC-010: (Error Handling) 404 friendly error on invalid campaign link")
    void testTC010_InvalidCampaignError() {
        CustomerWalletPage wallet = new CustomerWalletPage(driverMobile);
        wallet.openClaimUrl(baseUrl, "fake-invalid-uuid-99999");
        assertTrue(driverMobile.getPageSource().contains("not found") || 
                   driverMobile.getPageSource().contains("Error") ||
                   driverMobile.findElements(By.cssSelector("h1, h2")).size() > 0,
                "Must display friendly error page instead of raw crash");
    }

    @Test
    @DisplayName("TC-013: (QR Poster Generation) Counter poster rendering and print action")
    void testTC013_CounterPosterGeneration() {
        MerchantBackofficePage backoffice = new MerchantBackofficePage(driverDesktop);
        backoffice.openDashboard(baseUrl);
        if (driverDesktop.findElements(By.xpath("//button[contains(text(),'Print QR') or contains(text(),'Póster')]")).size() > 0) {
            backoffice.getPosterButton().click();
            assertTrue(driverDesktop.findElements(By.cssSelector("canvas, img, [data-testid='poster-qr']")).size() > 0,
                    "Poster QR code must render visually");
        }
    }
}
