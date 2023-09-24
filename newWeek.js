const weekDays = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
"Sabado",
]; //TODO: UNICODE accents
export function newWeek(token, dbID, jsonParam) {
  const exactCurrentDate = new Date();
  const currentDate = new Date(
    exactCurrentDate.getFullYear(),
    exactCurrentDate.getMonth(),
    exactCurrentDate.getDate(),
  );
  let pagesToModify = [];
  let existingCurrentWeekPages = [];
  let i = 0;
  jsonParam.results.forEach((r) => {
    i++;
    const properties = r.properties;
    const dateParts = properties["Fecha"]["date"]["start"].split("-");
    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    let diff = Math.floor((date - currentDate) / (1000 * 60 * 60 * 24));
    if (diff == 0 && date.getDay() != currentDate.getDay()) diff++;
    let page = [
      r.url.split("/")[3].split("-")[r.url.split("/")[3].split("-").length - 1],
      {
        "properties": {
          "Semana actual": {
            "checkbox": !properties["Semana actual"]["checkbox"],
          },
        },
      },
    ];
    if (diff >= 0 && diff <= 6) {
      existingCurrentWeekPages.push(date.getTime());
      if (!properties["Semana actual"]["checkbox"]) pagesToModify.push(page);
    } else {
      if (properties["Semana actual"]["checkbox"]) pagesToModify.push(page);
    }
  });
  let promises = [];
  pagesToModify.forEach((page) => {
    promises.push(
      fetch(`https://api.notion.com/v1/pages/${page[0]}/`, {
        method: "PATCH",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          "Authorization": `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify(page[1]),
      }),
    );
  });
  Promise.all(promises).then(() => {
    newWeekRows(dbID, token, currentDate, existingCurrentWeekPages);
  });
}
function newWeekRows(dbID, token, currentDate, existingCurrentWeekPages) {
  let promises = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentDate.getTime() + (i * 24 * 60 * 60 * 1000));
    if (existingCurrentWeekPages.includes(date.getTime())) continue;
    let newPage = {
      "parent": { "database_id": dbID },
      "properties": {
        "Semana actual": {
          "type": "checkbox",
          "checkbox": true,
        },
        "Fecha": {
          "type": "date",
          "date": {
            "start": `${date.getFullYear()}-${
              date.getMonth().toString().length == 1 ? "0" : ""
            }${date.getMonth() + 1}-${
              date.getDate().toString().length == 1 ? "0" : ""
            }${date.getDate()}`,
            "end": null,
            "time_zone": null,
          },
        },
        "Nombre": {
          "title": [
            {
              "text": {
                "content": `Dia ${i + 1} / ${weekDays[date.getDay()]}`,
              },
            },
          ],
        },
      },
    };
    promises.push(
      fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          "Authorization": `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify(newPage),
      }),
    );
  }
  Promise.all(promises).then(() => {
    browser.tabs.reload()
  })
}
