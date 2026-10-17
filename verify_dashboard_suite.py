import os
import time
from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:5173/signup")
    page.wait_for_timeout(1000)

    page.click("input[type='checkbox']")
    page.wait_for_timeout(300)

    email = f"recruitment_{int(time.time())}@techcorp.com"
    page.fill("input[placeholder='e.g. Aayush Mistri']", "Recruiter Admin")
    page.fill("input[placeholder='name@example.com']", email)
    page.fill("input[placeholder='••••••••']", "password123")
    page.fill("input[placeholder='Company Name']", "TechCorp Global")
    page.wait_for_timeout(500)

    page.get_by_role("button", name="Register as Hiring Company").click()
    page.wait_for_timeout(1500)

    page.goto("http://localhost:5173/company/jobs")
    page.wait_for_timeout(1500)

    page.screenshot(path="/home/jules/verification/screenshots/company_jobs_dashboard.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
