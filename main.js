document.addEventListener('DOMContentLoaded', function() {
    const jobTitleInput = document.getElementById('jobTitle');
    const companyNameInput = document.getElementById('companyName');
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
                    console.error(chrome.runtime.lastError);
                    statusDiv.textContent = 'Error injecting script.';
                    return;
                }

                const results = injectionResults[0].result;
                console.log(`results2=${results}`)
                if (results && (results.jobTitle || results.companyName)) {
                    jobTitleInput.value = results.jobTitle || '';
                    companyNameInput.value = results.companyName || '';
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
    const titleSelector = '.t-24 job-details-jobs-unified-top-card__job-title';
    const companySelector = '.topcard__org-name-link, .jobs-top-card__company-name-link, a[data-tracking-control-name="public_jobs_topcard-org-name"]';

    console.log("test");

    const jobTitleElement = document.querySelector(titleSelector);
    const companyNameElement = document.querySelector(companySelector);

    const jobTitle = jobTitleElement ? jobTitleElement.innerText.trim() : '';
    const companyName = companyNameElement ? companyNameElement.innerText.trim() : '';

    console.log(`Scraped Job Title: ${jobTitle}, Company Name: ${companyName}`);

    return { jobTitle, companyName };
}

