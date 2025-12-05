document.addEventListener("DOMContentLoaded", loadSettings);
document.getElementById("saveBtn").addEventListener("click", save);

async function loadSettings() {
    const { blockedSites, email, enabled } = await chrome.storage.sync.get([
        "blockedSites",
        "email",
        "enabled"
    ]);

    document.getElementById("blockedSites").value = (blockedSites || []).join("\n");
    document.getElementById("email").value = email || "";
    document.getElementById("enabled").checked = enabled ?? true;
}

async function save() {
    const blockedSites = document
        .getElementById("blockedSites")
        .value.split("\n")
        .map(x => x.trim())
        .filter(x => x.length > 0);

    const email = document.getElementById("email").value;
    const enabled = document.getElementById("enabled").checked;

    await chrome.storage.sync.set({ blockedSites, email, enabled });
    alert("Saved!");
}
