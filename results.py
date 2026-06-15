import time
import pygame
import os
import base64
import json
import urllib.request
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
API_URL = "https://siu-result-monitor-gamma.vercel.app/api/logs/create"


def start_aggressive_alarm():
    pygame.mixer.init()
    if os.path.exists(ALARM_FILE):
        pygame.mixer.music.load(ALARM_FILE)
        pygame.mixer.music.play(-1)
    while True:
        print("\a!!! RESULT OUT !!!")
        time.sleep(1)


def post_to_dashboard(status, response_time, error_message=None):
    screenshot_base64 = None
    if os.path.exists("debug_screenshot.png"):
        try:
            with open("debug_screenshot.png", "rb") as img_file:
                encoded = base64.b64encode(img_file.read()).decode("utf-8")
                screenshot_base64 = f"data:image/png;base64,{encoded}"
        except Exception as e:
            print(f"Failed to read screenshot file: {e}")

    payload = {
        "prn": PRN_NUMBER,
        "status": status,
        "responseTime": response_time,
        "errorMessage": error_message,
        "screenshot": screenshot_base64,
    }

    urls_to_try = [API_URL]
    local_fallback = "http://localhost:3000/api/logs/create"
    if API_URL != local_fallback:
        urls_to_try.append(local_fallback)

    posted = False
    for url in urls_to_try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req) as response:
                response.read()
                print(f"Posted status [{status}] to web dashboard ({url}) successfully.")
                posted = True
                break
        except Exception as e:
            print(f"Failed to post logs to {url}: {e}")

    if not posted:
        print("Could not post logs to any web dashboard.")


def check_portal():
    start_time = time.time()
    options = Options()
    options.add_argument("--headless=new")
    
    try:
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    except Exception as e:
        print(f"webdriver-manager failed ({e}). Trying to find cached driver...")
        import glob
        import os
        wdm_pattern = os.path.expanduser(r"~\.wdm\drivers\chromedriver\win64\**\chromedriver.exe")
        cached_paths = glob.glob(wdm_pattern, recursive=True)
        if cached_paths:
            cached_paths.sort()
            latest_cached = cached_paths[-1]
            print(f"Found cached driver at: {latest_cached}")
            driver = webdriver.Chrome(service=Service(latest_cached), options=options)
        else:
            print("No cached driver found. Falling back to native Selenium manager...")
            try:
                driver = webdriver.Chrome(options=options)
            except Exception as e2:
                print(f"Native Selenium manager also failed: {e2}")
                raise e2

    status = "NO_RESULT"
    error_msg = None

    try:
        driver.get(URL)
        wait = WebDriverWait(driver, 20)

        # FIX 1: Check for iFrames
        frames = driver.find_elements(By.TAG_NAME, "iframe")
        if len(frames) > 0:
            driver.switch_to.frame(0)

        # FIX 2: Target the PRN box by a more specific identifier
        try:
            prn_field = wait.until(EC.element_to_be_clickable(
                (By.XPATH, "//input[contains(@placeholder, 'PRN') or contains(@id, 'PRN') or @type='text']")))
        except:
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
            status = "SUCCESS"
        else:
            print(f"[{time.strftime('%H:%M:%S')}] Not found. (Checked debug_screenshot.png to confirm)")
            status = "NO_RESULT"

    except Exception as e:
        print(f"Error: {e}")
        status = "FAILED"
        error_msg = str(e)
    finally:
        driver.quit()

    # Calculate response time in ms
    elapsed_time = int((time.time() - start_time) * 1000)

    # Post data to Next.js API
    post_to_dashboard(status, elapsed_time, error_msg)

    # If results are found, ring the pygame alarm
    if status == "SUCCESS":
        start_aggressive_alarm()


if __name__ == "__main__":
    while True:
        check_portal()
        time.sleep(CHECK_INTERVAL)