package com.alpacard.qa.pages;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

public class DriverFactory {

    public static WebDriver createDriver(boolean mobileEmulation) {
        WebDriverManager.chromedriver().setup();
        ChromeOptions options = new ChromeOptions();

        // Anti-fraud & camera mocking as established in QA Master Test Plan
        options.addArguments("--use-fake-ui-for-media-stream");
        options.addArguments("--use-fake-device-for-media-stream");
        options.addArguments("--remote-allow-origins=*");
        options.addArguments("--disable-notifications");

        if (mobileEmulation) {
            Map<String, String> mobileParams = new HashMap<>();
            mobileParams.put("deviceName", "Pixel 7");
            options.setExperimentalOption("mobileEmulation", mobileParams);
        } else {
            options.addArguments("--start-maximized");
        }

        WebDriver driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
        return driver;
    }
}
