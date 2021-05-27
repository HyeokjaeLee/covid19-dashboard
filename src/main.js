const API_URL = "https://korea-covid19-api.herokuapp.com/";

const totalRegionData = (() => {
  const APIdata = getJsonAPI(API_URL + "total");
  const result = {
    date: [],
    newLocalInfected: [],
    newOverseasInfected: [],
    newTotalInfected: [],
    newRecovered: [],
    totalInfected: [],
    totalRecovered: [],
  };
  APIdata.forEach((data) => {
    result.date.push(date_former(data.date));
    result.newLocalInfected.push(data.confirmed.infected.new.local);
    result.newOverseasInfected.push(data.confirmed.infected.new.overseas);
    result.newTotalInfected.push(data.confirmed.infected.new.total);
    result.newRecovered.push(data.confirmed.recovered.new);
    result.totalInfected.push(data.confirmed.infected.total);
    result.totalRecovered.push(data.confirmed.recovered.total);
  });
  return result;
})();
const Region = getJsonAPI(API_URL);
const APIdata2 = Region.map((data) => {
  const aRegionData = getJsonAPI(API_URL + data.eng);
  return aRegionData;
});
console.log(APIdata2);
const regionList = document.getElementById("regionList");
Region.forEach((data) => {
  console.log(data);
  const region_li = document.createElement("div");
  region_li.setAttribute("id", data.eng);
  region_li.setAttribute("class", "chart_container");
  region_li.innerHTML = data.kor;
  regionList.appendChild(region_li);
});

c3.generate({
  bindto: "#test",
  padding: { left: 20, right: 20, top: 10, bottom: 10 },
  data: {
    xFormat: "%Y-%m-%d",
    json: {
      date: totalRegionData.date,
      격리자: totalRegionData.totalInfected,
      격리해제: totalRegionData.totalRecovered,
    },
    x: "date",
    type: "area-spline",
    types: {
      data1: "area-spline",
    },
  },
  axis: {
    x: {
      show: true,
      type: "timeseries",
      tick: {
        fit: false,
        outer: false,
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
    xFormat: "%Y-%m-%d",
    json: {
      date: totalRegionData.date,
      전체: totalRegionData.newTotalInfected,
      국내: totalRegionData.newLocalInfected,
      해외: totalRegionData.newOverseasInfected,
    },
    x: "date",
    type: "area",
    types: {
      data1: "area",
    },
    groups: [["국내", "해외"]],
  },
  axis: {
    x: {
      show: true,
      type: "timeseries",
      tick: {
        fit: false,
        outer: false,
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

function getJsonAPI(url) {
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
}

function date_former(str_date) {
  const date = new Date(str_date);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
/*var country_api = "https://api.covid19api.com/countries";
var main_api = "https://api.covid19api.com/total/country/";
var countries_options = "";
var countries_slug_list = new Array();
var countries_name_list = new Array();
var target_api = new Array();
var target_countries = new Array(3);
var ago_2day = new Date();
ago_2day.setDate(ago_2day.getDate() - 2);
var ago_31day = new Date();
ago_31day.setDate(ago_31day.getDate() - 31);
var country_arr;
var infected_arr;
var deceased_arr;
var recovered_arr;
var world_new_confirmed;
var world_new_deaths;
var month_for_x;

console.log()
function getFormatDate(date) {
  var year = date.getFullYear(); //yyyy
  var month = 1 + date.getMonth(); //M
  month = month >= 10 ? month : "0" + month; //month 두자리로 저장
  var day = date.getDate(); //d
  day = day >= 10 ? day : "0" + day; //day 두자리로 저장
  return year + "-" + month + "-" + day; //'-' 추가하여 yyyy-mm-dd 형태 생성 가능
}

function information() {
  alert("Global API : https://api.apify.com \nDetail API : https://api.covid19api.com \nE-Mail : Leehyeokjae97@gmail.com \n201601858 leehyeokjae");
}

function ajax_get(url, callback) {
  //ajax 구현을 위한 함수
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      console.log("responseText:" + xmlhttp.responseText);
      try {
        var data = JSON.parse(xmlhttp.responseText);
      } catch (err) {
        console.log(err.message + " in " + xmlhttp.responseText);
        return;
      }
      callback(data);
    }
  };
  xmlhttp.open("GET", url, false); //true는 비동기식, false는 동기식 true로 할시 변수 변경전에 웹페이지가 떠버림
  xmlhttp.send();
}

document.getElementById("target_time_start").value = getFormatDate(ago_31day);
document.getElementById("target_time_end").value = getFormatDate(ago_2day);

function change_value() {
  var target_time_start = document.getElementById("target_time_start").value;
  var target_time_end = document.getElementById("target_time_end").value;
  var date1 = new Date(target_time_start);
  var date2 = new Date(target_time_end);
  var diffDay = (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24) + 1; //입력받은 Date의 차
  var date_item_x = date1;
  var date_x = ["date"]; //X축 값을 배정해줄 배열

  var targets_country_confirmed = new Array();
  var targets_country_active = new Array();
  var targets_country_deaths = new Array();
  var targets_country_recovered = new Array();

  for (i = 0; i < 3; i++) {
    target_countries[i] = countries_slug_list[countries_name_list.indexOf(document.getElementById("country" + i + "_input").value)]; //입력받은 국가별 name값을 api를 받아올수 있는 slug값으로 변환해서 저장
    target_api[i] = main_api + target_countries[i] + "?from=" + target_time_start + "T00:00:00Z&to=" + target_time_end + "T00:00:00Z";
    ajax_get(target_api[i], function (data) {
      var target_country_confirmed = [document.getElementById("country" + i + "_input").value]; //처음에 for문을 돌렸더니 마지막 ajax값만 들어가서 서로 다른 ajax을 여러번 사용했으나 저장할 배열을 ajax안에서 선언하니 해결됨
      var target_country_active = [document.getElementById("country" + i + "_input").value];
      var target_country_deaths = [document.getElementById("country" + i + "_input").value];
      var target_country_recovered = [document.getElementById("country" + i + "_input").value];
      for (k = 1; k <= data.length; k++) {
        target_country_confirmed[k] = data[k - 1].Confirmed;
        target_country_active[k] = data[k - 1].Active;
        target_country_deaths[k] = data[k - 1].Deaths;
        target_country_recovered[k] = data[k - 1].Recovered;
      }
      targets_country_confirmed[i] = target_country_confirmed;
      targets_country_active[i] = target_country_active;
      targets_country_deaths[i] = target_country_deaths;
      targets_country_recovered[i] = target_country_recovered;
    });
  }
  for (i = 0; i < 3; i++) {
    if (targets_country_confirmed[i][2] === undefined) {
      alert(
        "Counrty[" + (i + 1) + "]'s api info is empty. ( " + document.getElementById("country" + i + "_input").value + " )\n Please choose the other country.",
      );
    }
  }
  var targets_country_new_confirmed = new Array();
  for (i = 0; i < 3; i++) {
    var target_country_new_confirmed = [targets_country_confirmed[i][0], null];
    for (k = 1; k < targets_country_confirmed[i].length; k++) {
      target_country_new_confirmed[k + 1] = targets_country_confirmed[i][k + 1] - targets_country_confirmed[i][k];
    }
    targets_country_new_confirmed[i] = target_country_new_confirmed;
  }

  //그래프 X축에 들어갈 날짜들
  for (i = 1; i <= diffDay; i++) {
    date_item_x.setDate(date_item_x.getDate() + i - 1);
    date_x[i] = getFormatDate(date_item_x).substring(2, 11);
    date_item_x = new Date(target_time_start);
  }

  var linechart = c3.generate({
    bindto: "#linechart",
    data: {
      x: "date",
      columns: [date_x, targets_country_confirmed[0], targets_country_confirmed[1], targets_country_confirmed[2]],
      type: "spline",
    },
    axis: {
      x: { type: "timeseries" },
    },
    point: {
      show: false,
    },
  });

  var linechart2 = c3.generate({
    bindto: "#linechart2",
    data: {
      x: "date",
      columns: [date_x, targets_country_new_confirmed[0], targets_country_new_confirmed[1], targets_country_new_confirmed[2]],
      type: "spline",
    },
    axis: {
      x: {
        type: "timeseries",
      },
    },
    point: {
      show: false,
    },
  });

  for (i = 0; i < 3; i++) {
    var donutchart = c3.generate({
      bindto: "#donutchart" + i,
      data: {
        columns: [
          ["Active", targets_country_active[i][targets_country_active[i].length - 1]],
          ["Deaths", targets_country_deaths[i][targets_country_deaths[i].length - 1]],
          ["Recovered", targets_country_recovered[i][targets_country_recovered[i].length - 1]],
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
        title: document.getElementById("country" + i + "_input").value,
      },
      axis: {
        x: {
          type: "categorized",
        },
      },
      bar: {
        width: {
          ratio: 0.5,
        },
      },
    });
  }

  var total_confirmed;
  var total_deaths;
  var total_recovered;
  var total_active;

  ajax_get("https://api.covid19api.com/world/total", function (data) {
    total_confirmed = data.TotalConfirmed;
    total_deaths = data.TotalDeaths;
    total_recovered = data.TotalRecovered;
    total_active = total_confirmed - (total_deaths + total_recovered);
  });

  document.getElementById("form_1_2").innerHTML =
    "Confirmed<br>" + total_confirmed + "<br><br>Active<br>" + total_active + "<br><br>Deaths<br>" + total_deaths + "<br><br>Recovered<br>" + total_recovered;
  var chart2 = c3.generate({
    bindto: "#form_1_1",
    data: {
      columns: [
        ["Active", total_active],
        ["Deaths", total_deaths],
        ["Recovered", total_recovered],
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
      title: "Worldwide",
    },
    axis: {
      x: {
        type: "categorized",
      },
    },
    bar: {
      width: {
        ratio: 0.5,
      },
    },
  });

  for (i = 0; i < 3; i++) {
    document.getElementById("country" + i + "_name").innerHTML = targets_country_confirmed[i][0];
    targets_country_confirmed[i][0] = "Confirmed";
    targets_country_deaths[i][0] = "Deaths";
    targets_country_active[i][0] = "Active";
    targets_country_recovered[i][0] = "Recovered";

    var country_detail = c3.generate({
      bindto: "#country" + i + "_detail",
      data: {
        x: "date",
        columns: [date_x, targets_country_confirmed[i], targets_country_deaths[i], targets_country_active[i], targets_country_recovered[i]],
        groups: [["Deaths", "Active", "Recovered"]],
        type: "area",
        types: {
          Confirmed: "line",
        },
        colors: { Deaths: "#8C8C8C", Recovered: "#86E57F", Active: "#F15F5F", Confirmed: "#FFBB00" },
      },
      axis: {
        y: { show: false },
        x: {
          type: "timeseries",
        },
      },
      point: {
        show: false,
      },
    });
  }
}

function fixed_value() {
  ajax_get(country_api, function (data) {
    //나라별 slug값과 name값을 받아옴
    for (i = 0; i < data.length; i++) {
      countries_slug_list[i] = data[i].Slug;
      countries_name_list[i] = data[i].Country;
      countries_options += '<option value="' + countries_name_list[i] + '">'; //받아온 나라별 name을 HTML Option 형식으로 바꿔서 저장
    }
    document.getElementById("countries").innerHTML = countries_options; // 저장한 옵션을 HTML에 입력
  });
  var fixed_value = new Worker("./src/worker/fixed.js");
  fixed_value.onmessage = function (event) {
    country_arr = event.data[0];
    infected_arr = event.data[1];
    deceased_arr = event.data[2];
    recovered_arr = event.data[3];
    world_new_confirmed = event.data[4];
    world_new_deaths = event.data[5];
    month_for_x = event.data[6];
    fixed_value_chart();
  };
}

function fixed_value_chart() {
  var Confirmed_by_countries = c3.generate({
    bindto: "#Confirmed_by_countries",

    data: {
      x: "Country",
      columns: [country_arr, infected_arr, recovered_arr, deceased_arr],
      type: "bar",
      colors: {
        Deaths: "#8C8C8C",
        Recovered: "#86E57F",
      },
    },
    axis: {
      legend: { hide: true },
      y: { show: false },
      x: { type: "categorized" },
    },
  });

  var worldchart = c3.generate({
    bindto: "#worldchart",

    data: {
      x: "Month",
      columns: [world_new_confirmed, month_for_x],
      type: "bar",
      colors: {
        NewConfirmed: "#F15F5F",
      },
    },
    axis: {
      y: { show: false },
      x: {
        type: "categorized",
      },
    },
  });
  var chart4 = c3.generate({
    bindto: "#worldchart2",

    data: {
      x: "Month",
      columns: [world_new_deaths, month_for_x],
      type: "bar",
      colors: {
        NewDeaths: "#8C8C8C",
      },
    },
    axis: {
      y: { show: false },
      x: {
        type: "categorized",
      },
    },
  });
}

function main_f() {
  fixed_value();
  change_value();
}
function date_change() {
  if (
    new Date(document.getElementById("target_time_end").value) > ago_2day ||
    new Date(document.getElementById("target_time_start").value) < new Date(2020, 2, 1)
  ) {
    alert("Please enter the correct date\nfrom " + new Date(2020, 2, 1) + "\nto " + ago_2day);
  } else {
    change_value();
  }
}
window.onload = main_f();
*/
