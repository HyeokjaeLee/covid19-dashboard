const API_URL = "https://korea-covid19-api.herokuapp.com/";
let region = "total";
let from = "";
//main
const main = () => {
  create_list_element();
  draw_chart(create_chart_data());
};

const change_date = (beforeDays) => {
    const today = new Date();
    from =
      beforeDays == undefined
        ? ""
        : date_former(today.setDate(today.getDate() - beforeDays), "");
    draw_chart(create_chart_data());
  },
  change_region = (region_eng) => {
    region = region_eng;
    draw_chart(create_chart_data());
  },
  create_chart_data = () => {
    const APIdata = getJsonAPI(API_URL + region + "?from=" + from),
      lastData = APIdata[APIdata.length - 1],
      totalRegionData = (() => {
        const result = {
          date: [],
          newLocalInfected: [],
          newOverseasInfected: [],
          newTotalInfected: [],
          newRecovered: [],
          totalConfirmed: [],
          totalRecovered: [],
          existingInfected: [],
          totalInfected: [],
        };
        APIdata.forEach((data) => {
          result.date.push(date_former(data.date, "-"));
          result.newLocalInfected.push(data.confirmed.infected.new.local);
          result.newOverseasInfected.push(data.confirmed.infected.new.overseas);
          result.newTotalInfected.push(data.confirmed.infected.new.total);
          result.newRecovered.push(data.confirmed.recovered.new);
          result.totalConfirmed.push(data.confirmed.total);
          result.totalRecovered.push(data.confirmed.recovered.total);
          result.existingInfected.push(data.confirmed.infected.existing);
          result.totalInfected.push(data.confirmed.infected.total);
        });
        return result;
      })();

    return { lastData: lastData, totalRegionData: totalRegionData };
  },
  draw_chart = (chartData) => {
    const totalRegionData = chartData.totalRegionData,
      lastData = chartData.lastData;
    c3.generate({
      bindto: "#test",
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
      data: {
        json: {
          date: totalRegionData.date,
          확진: totalRegionData.totalConfirmed,
          격리해제: totalRegionData.totalRecovered,
        },
        x: "date",
        type: "area",
        colors: { 확진: "#F15F5F", 격리해제: "#86E57F" },
      },
      axis: {
        x: {
          show: true,
          type: "timeseries",
          tick: {
            format: "%y.%m.%d",
            fit: true,
            outer: false,
            count: 7,
          },
        },
        y: {
          show: false,
        },
      },
      point: {
        show: false,
      },
    });

    c3.generate({
      bindto: "#test2",
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
      data: {
        json: {
          date: totalRegionData.date,
          전체: totalRegionData.newTotalInfected,
          국내: totalRegionData.newLocalInfected,
          해외: totalRegionData.newOverseasInfected,
        },
        x: "date",
        type: "area-spline",
        groups: [["국내", "해외"]],
      },
      axis: {
        x: {
          show: true,
          type: "timeseries",
          tick: {
            format: "%y.%m.%d",
            fit: true,
            outer: false,
            count: 5,
          },
        },
        y: {
          show: false,
        },
      },
      point: {
        show: false,
      },
    });

    c3.generate({
      bindto: "#test3",
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
      data: {
        json: {
          date: totalRegionData.date,
          기존격리: totalRegionData.existingInfected,
          신규격리: totalRegionData.newTotalInfected,
        },
        x: "date",
        type: "area-spline",
        groups: [["신규격리", "기존격리"]],
        order: "asc",
      },

      axis: {
        x: {
          show: true,
          type: "timeseries",
          tick: {
            format: "%y.%m.%d",
            fit: true,
            outer: false,
            count: 5,
          },
        },
        y: {
          show: false,
        },
      },
      point: {
        show: false,
      },
    });

    c3.generate({
      bindto: "#test4",
      data: {
        columns: [
          ["Active", lastData.confirmed.infected.total],
          ["Deaths", lastData.confirmed.death.total],
          ["Recovered", lastData.confirmed.recovered.total],
        ],
        type: "donut",
        colors: { Deaths: "#8C8C8C", Recovered: "#86E57F", Active: "#F15F5F" },
        labels: {
          format: {
            y: d3.format(".1%"),
          },
        },
      },
      donut: {
        expand: false,
        title: "ss",
      },
      axis: {
        x: {
          type: "categorized",
        },
      },
    });

    c3.generate({
      bindto: "#test5",
      data: {
        columns: [
          ["Active", lastData.confirmed.infected.total],
          ["Deaths", lastData.confirmed.death.total],
          ["Recovered", lastData.confirmed.recovered.total],
        ],
        type: "donut",
        colors: { Deaths: "#8C8C8C", Recovered: "#86E57F", Active: "#F15F5F" },
        labels: {
          format: {
            y: d3.format(".1%"),
          },
        },
      },
      donut: {
        expand: false,
        title: "ss",
      },
      axis: {
        x: {
          type: "categorized",
        },
      },
    });
  },
  create_list_element = () => {
    const recentData = getJsonAPI(API_URL + "recent"),
      regionList = document.getElementById("list"),
      updateElement = document.getElementById("updateDate"),
      updateDate = new Date(recentData[0].data.date);
    updateElement.innerHTML = `UPDATE : ${date_former(
      updateDate,
      "-"
    )} ${updateDate.getHours()}:${updateDate.getMinutes()}`;
    recentData.forEach((data, index) => {
      const region_li = document.createElement("li");
      region_li.setAttribute("id", data.region_eng);
      region_li.setAttribute("class", "summary_container");
      region_li.setAttribute("onclick", `change_region('${data.region_eng}')`);
      region_li.innerHTML = `
    <ul class="list_item">
      <li>${data.region_kor}</li>
      <li>${data.data.confirmed.infected.new.total}</li>
      <li>${data.data.confirmed.infected.total}</li>
      <li>${data.data.confirmed.total}</li>
    </ul>`;
      regionList.appendChild(region_li);
    });
  },
  getJsonAPI = (url) => {
    const xmlhttp = new XMLHttpRequest();
    let json_data;
    xmlhttp.onreadystatechange = () => {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        try {
          json_data = JSON.parse(xmlhttp.responseText);
        } catch (err) {
          console.log(err.message + " in " + xmlhttp.responseText);
        }
      }
    };
    xmlhttp.open("GET", url, false); //true는 비동기식, false는 동기식 true로 할시 변수 변경전에 웹페이지가 떠버림
    xmlhttp.send();
    return json_data;
  },
  date_former = (str_date, separatedValue) => {
    const date = new Date(str_date);
    let month = date.getMonth() + 1,
      day = date.getDate();
    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;
    return date.getFullYear() + separatedValue + month + separatedValue + day;
  };

main();
