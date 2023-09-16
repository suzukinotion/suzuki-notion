document.addEventListener("DOMContentLoaded", function () {
  const postButton = document.getElementById("postButton")
  const newWeekButton = document.getElementById("newWeek")
  const tokenForm = document.getElementById("tokenForm")
  postButton.addEventListener("click", function () {
    const tokenPromise = browser.storage.local.get(['token'])
    const dbIDPromise = browser.storage.local.get(['dbID'])
    Promise.all([tokenPromise, dbIDPromise]).then((promises) => fetchData(promises[0].token, promises[1].dbID, processData))
  })
  newWeekButton.addEventListener("click", function() {
    const tokenPromise = browser.storage.local.get(['token'])
    const dbIDPromise = browser.storage.local.get(['dbID'])
    Promise.all([tokenPromise, dbIDPromise]).then((promises) => fetchData(promises[0].token, promises[1].dbID, newWeek))
  })
  tokenForm.addEventListener('submit', function (submit) {
    submit.preventDefault()
    let token = document.getElementById("tokenInput").value
    browser.storage.local.set({'token': token})
  })
  dbForm.addEventListener('submit', function (submit) {
    submit.preventDefault()
    let dbID = document.getElementById("dbInput").value
    browser.storage.local.set({'dbID': dbID})
  })
});
function newWeek(token, dbID, jsonParam) {
  const exactCurrentDate = new Date()
  const currentDate = new Date(exactCurrentDate.getFullYear(), exactCurrentDate.getMonth(), exactCurrentDate.getDate())
  let pagesToModify = []
  let existingCurrentWeekPages = []
  let i = 0
  jsonParam.results.forEach((r) => {
    i++
    const properties = r.properties
    const dateParts = properties["Fecha"]["date"]["start"].split("-")
    const date = new Date(dateParts[0], dateParts[1]-1, dateParts[2])
    let diff = Math.floor((date-currentDate)/(1000*60*60*24))
    if (diff == 0 && date.getDay() != currentDate.getDay()) diff++
    let page = [r.url.split("/")[3].split("-")[r.url.split("/")[3].split("-").length-1], {
      "properties": {
        "Semana actual": {"checkbox": !properties["Semana actual"]["checkbox"]}
      }
    }]
    if (diff >= 0 && diff <= 6) {
      existingCurrentWeekPages.push(date.getTime())
      if(!properties["Semana actual"]["checkbox"]) pagesToModify.push(page)
    } else {
      if(properties["Semana actual"]["checkbox"]) pagesToModify.push(page)
    }
  })
  pagesToModify.forEach((page) => {
    fetch(`https://api.notion.com/v1/pages/${page[0]}/`, {
     method: "PATCH",
     headers: {
         "Content-type": "application/json; charset=UTF-8",
         "Authorization": `Bearer ${token}`,
         "Notion-Version": "2022-06-28"
     },
     body: JSON.stringify(page[1])
    }).then((response) => {
        if (!response.ok) {
          response.json().then((finalData) => console.warn(finalData))
          throw new Error("Network response was not ok: ")
        }

        return response.json();
      }).then((data) => {
        // Handle the response data here
        
      }).catch((error) => {
        // Handle errors here
        console.error("There was a problem with the fetch operation:", error);
      })
  })
  for (i = 0; i < 7; i++) {
    const date = new Date(currentDate.getTime() + (i * 24 * 60 * 60 * 1000))
    if (existingCurrentWeekPages.includes(date.getTime())) continue
    let newPage = {
      "parent": {"database_id": dbID},
      "properties": {
        "Semana actual": {
          "type": "checkbox",
          "checkbox": true
        },
        "Fecha": {
          "type": "date",
          "date": {
            "start": `${date.getFullYear()}-${date.getMonth().toString().length == 1 ? "0" : ""}${date.getMonth()+1}-${date.getDate().toString().length == 1 ? "0" : ""}${date.getDate()}`,
            "end": null,
            "time_zone": null
          }
        },
        "Notas": {
          "title": [
			    	{
				    	"text": {
					    	"content": `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`
			    		}
		    		}
		    	]
        }
      }
    }
    fetch('https://api.notion.com/v1/pages', {
      method: "POST",
      headers: {
         "Content-type": "application/json; charset=UTF-8",
         "Authorization": `Bearer ${token}`,
         "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify(newPage)
    }).then((response) => {
        if (!response.ok) {
          response.json().then((finalData) => console.warn(finalData))
          throw new Error("Network response was not ok: ")
        }

        return response.json();
      }).then((data) => {
        // Handle the response data here
        
      }).catch((error) => {
        // Handle errors here
        console.error("There was a problem with the fetch operation:", error);
      })
  }
  new Promise (r => setTimeout(r, 500)).then(browser.tabs.reload())
  
}
function fetchData(token, dbID, callback) {
  fetch(`https://api.notion.com/v1/databases/${dbID}/query`, {
      method: "POST",
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28"
      },
      body: "", // Replace with your data
    }).then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      }).then((data) => {
        // Handle the response data here
        callback(token, dbID, data)
        
      }).catch((error) => {
        // Handle errors here
        console.error("There was a problem with the fetch operation:", error);
      })
}
function processData (token, dbID, json) {
  let stats = {
    "total":0,
    "currentWeekTotal":0,
    "revCount":0,
    "currentWeekRevCount":0,
    "techCount":0,
    "currentWeekTechCount":0,
    "topPieceCount":0,
    "currentWeekTopPieceCount":0,
    "newPieceCount":0,
    "currentWeekNewPieceCount":0
  }
  json.results.forEach((r) => {
    stats.total++
    const properties = r.properties
    const technique = properties["T\u00E9cnica"]["checkbox"]
    const revision = properties["Revisi\u00F3n"]["checkbox"]
    const topPiece = properties["Pieza top"]["checkbox"]
    const newPiece = properties["Nueva pieza"]["checkbox"]
    const thisWeek = properties["Semana actual"]["checkbox"]
    if (thisWeek) stats.currentWeekTotal++
    if (technique) {
      stats.techCount++
      if (thisWeek) stats.currentWeekTechCount++
    }
    if (revision) {
      stats.revCount++
      if (thisWeek) stats.currentWeekRevCount++
    }
    if (topPiece) {
      stats.topPieceCount++
      if (thisWeek) stats.currentWeekTopPieceCount++
    }
    if (newPiece) {
      stats.newPieceCount++
      if (thisWeek) stats.currentWeekNewPieceCount++
    }
  })
  chart(stats)
}
function chart (stats) {
  google.charts.load("current", { packages: ["corechart"]});
  google.charts.load("current", { packages: ["bar"]});
  google.charts.setOnLoadCallback(function () {
    
    var data = google.visualization.arrayToDataTable([
      ['Faceta', '\u00daltima semana', 'Total'],
      ['T\u00E9cnica', stats.currentWeekTechCount/stats.currentWeekTotal, stats.techCount/stats.total],
      ['Revisi\u00F3n', stats.currentWeekRevCount/stats.currentWeekTotal, stats.revCount/stats.total],
      ['Pieza top', stats.currentWeekTopPieceCount/stats.currentWeekTotal, stats.topPieceCount/stats.total],
      ['Nueva pieza', stats.currentWeekNewPieceCount/stats.currentWeekTotal, stats.newPieceCount/stats.total],

    ]);

    var options = {
      chart: {
        title: 'Datos de pr\u00e1ctica',
        subtitle: '2023',
      }
    };

    document.getElementById('chartContainer').style.removeProperty("display")
    var chart = new google.charts.Bar(document.getElementById('chartContainer'));
    chart.draw(data, google.charts.Bar.convertOptions(options));

  });
  
}
