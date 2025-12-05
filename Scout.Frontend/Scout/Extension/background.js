const BACKEND_URL = "https://scout-email-api.vercel.app/api/email";
const ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

const lastAlerts = {};

// When tab finishes loading
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete" || !tab.url) return;
    handleTabVisit(tab);
});

// When user switches tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url) handleTabVisit(tab);
});

async function handleTabVisit(tab) {
    try {
        const { blockedSites, email, enabled } = await chrome.storage.sync.get([
            "blockedSites",
            "email",
            "enabled"
        ]);

        if (!enabled) return;
        if (!blockedSites?.length || !email) return;

        const hostname = new URL(tab.url).hostname.toLowerCase();
        if (!isBlocked(hostname, blockedSites)) return;

        const now = Date.now();
        const last = lastAlerts[hostname] || 0;
        if (now - last < ALERT_COOLDOWN_MS) return;

        lastAlerts[hostname] = now;

        await captureAndSend(tab, email);
    } catch (err) {
        console.error("Scout error:", err);
    }
}

function isBlocked(hostname, list) {
    return list.some(entry => {
        const term = entry.trim().toLowerCase();
        return term && hostname.includes(term);
    });
}

async function captureAndSend(tab, email) {
    try {
        const image = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });

        const payload = {
            image,
            url: tab.url,
            title: tab.title,
            email,
            timestamp: new Date().toISOString()
        };

        await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.error("Failed to send screenshot:", err);
    }
}
