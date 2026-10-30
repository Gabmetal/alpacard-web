package com.alpacard.qa.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class CustomerWalletPage {
    private final WebDriver driver;

    private final By stampCounter = By.cssSelector("[data-testid='stamp-counter'], .stamp-count");
    private final By qrCode = By.cssSelector("[data-testid='dynamic-qr'], canvas, svg");
    private final By claimRewardBtn = By.xpath("//button[contains(text(),'Claim Reward') or contains(text(),'Canjear')]");
    private final By celebrationModal = By.cssSelector("[data-testid='celebration-modal']");

    public CustomerWalletPage(WebDriver driver) {
        this.driver = driver;
    }

    public void openClaimUrl(String baseUrl, String campaignId) {
        driver.get(baseUrl + "/claim/" + campaignId);
    }

    public String getStampCount() {
        return driver.findElement(stampCounter).getText();
    }

    public WebElement getQrCodeElement() {
        return driver.findElement(qrCode);
    }

    public WebElement getClaimRewardButton() {
        return driver.findElement(claimRewardBtn);
    }

    public WebElement getCelebrationModal() {
        return driver.findElement(celebrationModal);
    }
}
