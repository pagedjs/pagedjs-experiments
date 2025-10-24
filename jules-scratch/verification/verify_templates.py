from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    # Listen for console events
    page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

    # Table of Contents
    print("--- Loading TOC ---")
    page.goto("http://localhost:8000/--paged-toc/index.html")
    page.wait_for_function("() => window.pagedJsRendered")
    page.screenshot(path="jules-scratch/verification/toc.png")
    print("--- TOC Screenshot taken ---")

    # Footnotes
    print("--- Loading Footnotes ---")
    page.goto("http://localhost:8000/--paged-footnotes/index.html")
    page.wait_for_function("() => window.pagedJsRendered")
    page.screenshot(path="jules-scratch/verification/footnotes.png")
    print("--- Footnotes Screenshot taken ---")

    # Running Headers and Footers
    print("--- Loading Headers/Footers ---")
    page.goto("http://localhost:8000/--paged-headers-footers/index.html")
    page.wait_for_function("() => window.pagedJsRendered")
    page.screenshot(path="jules-scratch/verification/headers-footers.png")
    print("--- Headers/Footers Screenshot taken ---")


    browser.close()

with sync_playwright() as playwright:
    run(playwright)
