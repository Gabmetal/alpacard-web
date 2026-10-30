package com.alpacard.qa.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class MerchantBackofficePage {
    private final WebDriver driver;

    private final By businessNameInput = By.cssSelector("input[name='businessName'], input[id='venue-name']");
    private final By saveVenueBtn = By.xpath("//button[contains(text(),'Save') or contains(text(),'Guardar')]");
    private final By newCampaignBtn = By.xpath("//button[contains(text(),'New Campaign') or contains(text(),'Nueva')]");
    private final By campaignTitleInput = By.cssSelector("input[name='title'], input[id='campaign-name']");
    private final By totalStampsInput = By.cssSelector("input[name='totalStamps'], input[type='number']");
    private final By rewardTitleInput = By.cssSelector("input[name='rewardDescription'], input[name='rewardTitle']");
    private final By saveCampaignBtn = By.cssSelector("button[type='submit']");
    private final By printPosterBtn = By.xpath("//button[contains(text(),'Print QR') or contains(text(),'Póster')]");

    public MerchantBackofficePage(WebDriver driver) {
        this.driver = driver;
    }

    public void openDashboard(String baseUrl) {
        driver.get(baseUrl + "/dashboard");
    }

    public void createVenue(String name) {
        WebElement input = driver.findElement(businessNameInput);
        input.clear();
        input.sendKeys(name);
        driver.findElement(saveVenueBtn).click();
    }

    public void createCampaign(String title, int stamps, String reward) {
        driver.findElement(newCampaignBtn).click();
        driver.findElement(campaignTitleInput).sendKeys(title);
        WebElement stampInput = driver.findElement(totalStampsInput);
        stampInput.clear();
        stampInput.sendKeys(String.valueOf(stamps));
        driver.findElement(rewardTitleInput).sendKeys(reward);
        driver.findElement(saveCampaignBtn).click();
    }

    public WebElement getPosterButton() {
        return driver.findElement(printPosterBtn);
    }
}
