function chart(stats) {
  google.charts.load("current", { packages: ["corechart"] });
  google.charts.load("current", { packages: ["bar"] });
  let dataArray = [["Faceta", "\u00daltima semana", "Total"]];
  for (const key in stats) {
    if (!stats.hasOwnProperty(key)) continue;
    if (!stats[key].hasOwnProperty("total")) continue;
    dataArray.push([
      key,
      stats[key]["currentWeek"] / stats.currentWeekTotal,
      stats[key]["total"] / stats.total,
    ]);
  }
  console.warn("dataArray: " + dataArray);
  google.charts.setOnLoadCallback(function () {
    var data = google.visualization.arrayToDataTable(dataArray);

    var options = {
      backgroundColor: {
        fill: "#111",
      },
      chartArea: { backgroundColor: "#111" },
      chart: {
        title: "Datos de pr\u00e1ctica",
        subtitle: "2023",
      },
    };

    document.getElementById("chartContainer").style.removeProperty("display");
    var chart = new google.charts.Bar(
      document.getElementById("chartContainer"),
    );
    chart.draw(data, google.charts.Bar.convertOptions(options));
  });
}
export function processCheckboxData(token, dbID, json) {
  let stats = { "total": 0, "currentWeekTotal": 0 };
  json.results.forEach((r) => {
    stats.total++;
    const properties = r.properties;
    const thisWeek = properties["Semana actual"]["checkbox"];
    if (thisWeek) stats.currentWeekTotal++;
    for (const key in properties) {
      if (!properties.hasOwnProperty(key)) continue;
      if (key == "Semana actual") continue;
      if (!properties[key].hasOwnProperty("type")) continue;
      if (properties[key]["type"] == "checkbox") {
        const checked = properties[key]["checkbox"];
        if (!stats.hasOwnProperty(key)) {
          stats[key] = {
            "total": checked ? 1 : 0,
            "currentWeek": (checked && thisWeek) ? 1 : 0,
          };
        } else {
          if (checked) stats[key]["total"]++;
          if (checked && thisWeek) stats[key]["currentWeek"]++;
        }
      }
    }
  });
  console.warn("stats: " + JSON.stringify(stats));
  chart(stats);
}

