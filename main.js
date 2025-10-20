document.addEventListener('DOMContentLoaded', function() {
    const jobTitleInput = document.getElementById('jobTitle');
    const companyNameInput = document.getElementById('companyName');
    const jobUrlInput = document.getElementById('jobUrl');
    const saveBtn = document.getElementById('saveBtn');
    const autofillBtn = document.getElementById('autofillBtn');
    const statusDiv = document.getElementById('status');

    // --- Save Button Logic ---
    saveBtn.addEventListener('click', function() {
        const jobTitle = jobTitleInput.value;
        const companyName = companyNameInput.value;

        if (jobTitle && companyName) {
            console.log('Job Title:', jobTitle);
            console.log('Company Name:', companyName);
            
            saveBtn.textContent = 'Saved!';
            setTimeout(() => {
                saveBtn.textContent = 'Save';
            }, 1500);
            
            jobTitleInput.value = '';
            companyNameInput.value = '';

        } else {
            console.log('Both fields are required.');
            statusDiv.textContent = 'Both fields are required to save.';
             setTimeout(() => {
                statusDiv.textContent = '';
            }, 2000);
        }
    });

    // --- Autofill Button Logic ---
    autofillBtn.addEventListener('click', async () => {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Check if the tab is a LinkedIn job page before trying to inject the script
        if (tab.url && tab.url.includes("linkedin.com/jobs/view/")) {
            statusDiv.textContent = 'Fetching details...';
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: scrapeJobDetails,
            }, (injectionResults) => {
                if (chrome.runtime.lastError) {
                    console.error('injection error', chrome.runtime.lastError);
                    statusDiv.textContent = 'Error injecting script.';
                    setTimeout(() => { statusDiv.textContent = ''; }, 2000);
                    return;
                }

                if (!injectionResults || !injectionResults[0]) {
                    console.error('No injection results', injectionResults);
                    statusDiv.textContent = 'No results from page.';
                    setTimeout(() => { statusDiv.textContent = ''; }, 2000);
                    return;
                }

                const results = injectionResults[0].result || {};

                // Log diagnostics returned from the injected page script.
                if (results.diagnostics && Array.isArray(results.diagnostics)) {
                    console.group('scrapeJobDetails diagnostics');
                    results.diagnostics.forEach(d => console.log(d));
                    console.groupEnd();
                }

                console.log('scrape results', results);

                if (results && (results.jobTitle || results.companyName)) {
                    jobTitleInput.value = results.jobTitle || '';
                    companyNameInput.value = results.companyName || '';
                    jobUrlInput.value = tab.url;
                    statusDiv.textContent = 'Details filled!';
                } else {
                    statusDiv.textContent = 'Could not find details on page.';
                }
                setTimeout(() => {
                    statusDiv.textContent = '';
                }, 2000);
            });
        } else {
            statusDiv.textContent = 'Not a LinkedIn job page.';
             setTimeout(() => {
                statusDiv.textContent = '';
            }, 2000);
        }
    });
});

// This function will be injected into the active LinkedIn tab.
// It runs in the context of the page, not the extension.
function scrapeJobDetails() {
    // Selectors for LinkedIn job pages can change. These are common ones.
    // Fixed selector: missing dot between class names was preventing matches.
    const titleSelector = '.t-24.job-details-jobs-unified-top-card__job-title, .topcard__title, h1';
    const companySelector = '.job-details-jobs-unified-top-card__company-name';

    // NOTE: console.log inside an injected page script appears in the page's console,
    // not the extension popup console. To surface diagnostics to the popup we return
    // them from this function and log them in the popup context.
    const diagnostics = [];
    diagnostics.push(`running scrapeJobDetails on ${location.href}`);

    const jobTitleElement = document.querySelector(titleSelector);
    diagnostics.push(`titleSelector=${titleSelector}, found=${!!jobTitleElement}`);

    const companyNameElement = document.querySelector(companySelector);
    diagnostics.push(`companySelector=${companySelector}, found=${!!companyNameElement}`);

    const jobTitle = jobTitleElement ? jobTitleElement.innerText.trim() : '';
    const companyName = companyNameElement ? companyNameElement.innerText.trim() : '';

    diagnostics.push(`Scraped Job Title: ${jobTitle}`);
    diagnostics.push(`Scraped Company Name: ${companyName}`);

    return { jobTitle, companyName, diagnostics };
}

