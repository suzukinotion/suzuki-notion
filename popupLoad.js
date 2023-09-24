import { processCheckboxData } from './checkboxCharts.js'
import { newWeek } from './newWeek.js'
export function onLoad() {
  const chartCheckboxesButton = document.getElementById("chartCheckboxesButton");
  const newWeekButton = document.getElementById("newWeekButton");
  const tokenForm = document.getElementById("tokenForm");
  const storagePromises = []
  storagePromises.push(browser.storage.local.get(["token"]))
  storagePromises.push(browser.storage.local.get(["dbID"]))
  chartCheckboxesButton.addEventListener("click", function () {
    Promise.all(storagePromises).then((promises) =>
      fetchData(promises[0].token, promises[1].dbID, processCheckboxData)
    );
  });
  newWeekButton.addEventListener("click", function () {
    Promise.all(storagePromises).then((promises) =>
      fetchData(promises[0].token, promises[1].dbID, newWeek)
    );
  });
  tokenForm.addEventListener("submit", function (submit) {
    submit.preventDefault();
    let token = document.getElementById("tokenInput").value;
    browser.storage.local.set({ "token": token });
  });
  dbForm.addEventListener("submit", function (submit) {
    submit.preventDefault();
    let dbID = document.getElementById("dbInput").value;
    console.warn("value: '" + dbID + "'");
    if (dbID == "") {
      browser.tabs.query(
        { active: true, currentWindow: true },
        function (tabs) {
          document.getElementById("dbInput").value =
            tabs[0].url.split(".so/")[1].split("?v=")[0];
          browser.storage.local.set({
            "dbID": document.getElementById("dbInput").value,
          });
        },
      );
      return;
    }
    browser.storage.local.set({ "dbID": dbID });
  });
}
function fetchData(token, dbID, callback) {
  fetch(`https://api.notion.com/v1/databases/${dbID}/query`, {
    method: "POST",
    headers: {
      "Content-type": "application/json; charset=UTF-8",
      "Authorization": `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
    },
    body: "", // Replace with your data
  }).then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  }).then((data) => {
    // Handle the response data here
    callback(token, dbID, data);
  }).catch((error) => {
    // Handle errors here
    console.error("There was a problem with the fetch operation:", error);
  });
}
