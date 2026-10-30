package com.alpacard.qa.suites;

import com.alpacard.qa.pages.CustomerWalletPage;
import com.alpacard.qa.pages.DriverFactory;
import com.alpacard.qa.pages.MerchantBackofficePage;
import org.junit.jupiter.api.*;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

import static org.junit.jupiter.api.Assertions.*;

@Tag("smoke")
public class SmokeTestSuite {
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
    @DisplayName("TC-011: (Create Venue) Baseline owner venue registration")
    void testTC011_CreateVenue() {
        MerchantBackofficePage backoffice = new MerchantBackofficePage(driverDesktop);
        backoffice.openDashboard(baseUrl);
        String venueName = "Auto Venue " + System.currentTimeMillis();
        backoffice.createVenue(venueName);
        assertTrue(driverDesktop.getPageSource().contains(venueName), "Dashboard must display created venue name");
    }

    @Test
    @DisplayName("TC-012: (Create Campaign) Define fidelity campaign rule")
    void testTC012_CreateCampaign() {
        MerchantBackofficePage backoffice = new MerchantBackofficePage(driverDesktop);
        backoffice.openDashboard(baseUrl);
        String campaignTitle = "Smoke 10 Stamps " + System.currentTimeMillis();
        backoffice.createCampaign(campaignTitle, 10, "Free Cappuccino");
        assertTrue(driverDesktop.getPageSource().contains(campaignTitle), "Active campaign should appear on dashboard");
    }

    @Test
    @DisplayName("TC-008: (Customer Acquisition) Direct anonymous wallet initialization")
    void testTC008_CustomerAcquisition() {
        CustomerWalletPage wallet = new CustomerWalletPage(driverMobile);
        long start = System.currentTimeMillis();
        wallet.openClaimUrl(baseUrl, "00000000-0000-0000-0000-000000000001");
        
        long elapsed = System.currentTimeMillis() - start;
        // Verify fast onboarding without login forms
        assertEquals(0, driverMobile.findElements(By.cssSelector("input[type='password']")).size(), "Zero forms expected");
        assertTrue(elapsed < 4000, "Wallet must load quickly");
    }

    @Test
    @DisplayName("TC-001: (Add Stamp) Dynamic QR display and counter scan")
    void testTC001_ScanDynamicQR() {
        CustomerWalletPage wallet = new CustomerWalletPage(driverMobile);
        wallet.openClaimUrl(baseUrl, "00000000-0000-0000-0000-000000000001");
        assertNotNull(wallet.getQrCodeElement(), "Dynamic QR must be visible for barista scanner");
    }
}
