import time
import pygame
import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# --- CONFIGURATION ---
URL = "https://siuexam.siu.edu.in/forms/resultview.html"
PRN_NUMBER = "24070126017"
ALARM_FILE = "audio.mp3"
CHECK_INTERVAL = 60


def start_aggressive_alarm():
    pygame.mixer.init()
    if os.path.exists(ALARM_FILE):
        pygame.mixer.music.load(ALARM_FILE)
        pygame.mixer.music.play(-1)
    while True:
        print("\a!!! RESULT OUT !!!")
        time.sleep(1)


def check_portal():
    options = Options()
    options.add_argument("--headless=new")
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    try:
        driver.get(URL)
        wait = WebDriverWait(driver, 20)

        # FIX 1: Check for iFrames
        # Many SIU pages wrap the form inside a frame.
        # If the input isn't found, we try to switch to the frame.
        frames = driver.find_elements(By.TAG_NAME, "iframe")
        if len(frames) > 0:
            driver.switch_to.frame(0)

        # FIX 2: Target the PRN box by a more specific identifier
        # SIU typically uses 'txtPRN' or an input with 'PRN' in the name
        try:
            prn_field = wait.until(EC.element_to_be_clickable(
                (By.XPATH, "//input[contains(@placeholder, 'PRN') or contains(@id, 'PRN') or @type='text']")))
        except:
            # Fallback to the first available input if specific one fails
            prn_field = wait.until(EC.element_to_be_clickable((By.TAG_NAME, "input")))

        prn_field.clear()
        prn_field.send_keys(PRN_NUMBER)

        # Click the "View" button specifically
        try:
            btn = driver.find_element(By.XPATH, "//input[@type='button' or @type='submit' or contains(@value, 'View')]")
            btn.click()
        except:
            prn_field.send_keys(Keys.ENTER)

        time.sleep(5)  # Let the JavaScript load

        # DEBUG: Save a screenshot to see what the bot sees
        driver.save_screenshot("debug_screenshot.png")

        # FIX 3: Look for "Seat" anywhere in the visible text
        body_text = driver.find_element(By.TAG_NAME, "body").text

        if "Seat" in body_text or "Seat Number" in body_text:
            print("SUCCESS: Result prompt detected!")
            driver.quit()
            start_aggressive_alarm()
        else:
            print(f"[{time.strftime('%H:%M:%S')}] Not found. (Checked debug_screenshot.png to confirm)")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        driver.quit()


if __name__ == "__main__":
    while True:
        check_portal()
        time.sleep(CHECK_INTERVAL)