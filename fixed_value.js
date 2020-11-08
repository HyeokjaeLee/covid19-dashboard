function getFormatDate(date) {
    var year = date.getFullYear();              //yyyy
    var month = (1 + date.getMonth());          //M
    month = month >= 10 ? month : '0' + month;  //month 두자리로 저장
    var day = date.getDate();                   //d
    day = day >= 10 ? day : '0' + day;          //day 두자리로 저장
    return year + '-' + month + '-' + day;     //'-' 추가하여 yyyy-mm-dd 형태 생성 가능
  }
function ajax_get(url, callback) {//ajax 구현을 위한 함수
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            console.log('responseText:' + xmlhttp.responseText);
            try { var data = JSON.parse(xmlhttp.responseText); }
            catch (err) {
                console.log(err.message + " in " + xmlhttp.responseText);
                return;
            }
            callback(data);
        }
    };
    xmlhttp.open("GET", url, false); //true는 비동기식, false는 동기식 true로 할시 변수 변경전에 웹페이지가 떠버림
    xmlhttp.send();
}

var total_info = new Array();
var country_arr = ["Country"];
var infected_arr = ["Confirmed"];
var deceased_arr = ["Deaths"];
var recovered_arr = ["Recovered"];
ajax_get("https://api.apify.com/v2/key-value-stores/tVaYRsPHLjNdNBu7S/records/LATEST?disableRedirect=true", function (data) {
  for (i = 0; i < data.length; i++) {
    total_info[i] = [data[i].country, data[i].infected, data[i].deceased, data[i].recovered];
  }
  total_info.sort(function (a, b) {
    return b[1] - a[1];
  });
  for (i = 1; i <= 20; i++) {
    country_arr[i] = total_info[i - 1][0];
    infected_arr[i] = total_info[i - 1][1];
    deceased_arr[i] = total_info[i - 1][2];
    recovered_arr[i] = total_info[i - 1][3];
  }
});

var record_start_day = new Date(2020, 3, 1); //월은 0월부터 시작
var record_start_day2 = new Date(2020, 4, 1);
var world_new_confirmed = ["NewConfirmed"];
var world_new_deaths = ["NewDeaths"];
var month_for_x = ["Month"];

setTimeout(function () {//한번에 api정보를 다 못받아와서 시간차를 둠
    for (i = 1; record_start_day2 < new Date(); i++) {
        var rsd_url = getFormatDate(record_start_day);
        var rsd2_url = getFormatDate(record_start_day2);
        month_for_x[i] = rsd_url.substr(2, 5);
        ajax_get("https://api.covid19api.com/world?from=" + rsd_url + "T00:00:00Z&to=" + rsd2_url + "T00:00:00Z", function (data) {
            world_new_confirmed[i] = 0;
            world_new_deaths[i] = 0;
            for (k = 0; k < data.length; k++) {
                world_new_confirmed[i] += data[k].NewConfirmed;
                world_new_deaths[i] += data[k].NewDeaths;
            }
            record_start_day.setMonth(record_start_day.getMonth() + 1);
            record_start_day2.setMonth(record_start_day2.getMonth() + 1);
        });
    }
var world_value=[country_arr,infected_arr,deceased_arr,recovered_arr,world_new_confirmed,world_new_deaths,month_for_x];//배열에 들어가있는 값 잘 확인하기
postMessage(world_value);
}, 3000);