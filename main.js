function getFormatDate(date){
    var year = date.getFullYear();              //yyyy
    var month = (1 + date.getMonth());          //M
    month = month >= 10 ? month : '0' + month;  //month 두자리로 저장
    var day = date.getDate();                   //d
    day = day >= 10 ? day : '0' + day;          //day 두자리로 저장
    return  year + '-' + month + '-' + day;     //'-' 추가하여 yyyy-mm-dd 형태 생성 가능
}

function sum(array) {
  var result = 0.0;

  for (var i = 0; i < array.length; i++)
    result += array[i];

  return result;
}

function country1_help_on(){
  document.getElementById("help_country1").innerHTML = "1번 나라는 가장 많은 정보를 표시합니다.";
	document.getElementById("help_country1").style.color="green";
}
function country1_help_off(){
  document.getElementById("help_country1").innerHTML = "";
}

var ago_2day=new Date();
ago_2day.setDate(ago_2day.getDate()-2);
var ago_31day=new Date();
ago_31day.setDate(ago_31day.getDate()-31);
var target_times=[];



document.getElementById("target_time_start").value = getFormatDate(ago_31day);
document.getElementById("target_time_end").value = getFormatDate(ago_2day);

function main_f() {
var country_api = "https://api.covid19api.com/countries";
var main_api = "https://api.covid19api.com/total/country/";
var target_api = new Array();

var countries_options = "";
var countries_slug_list = new Array();
var countries_name_list = new Array();
var target_countries = new Array(3);


var target_time_start = document.getElementById("target_time_start").value;
var target_time_end = document.getElementById("target_time_end").value;
var date1 = new Date(target_time_start);
var date2 = new Date(target_time_end);
var diffDay = (date2.getTime()-date1.getTime()) / (1000*60*60*24)+1; //입력받은 Date의 차
var date_item_x = date1;
var date_x = ["date"]; //X축 값을 배정해줄 배열







//나라별 slug값과 name값을 받아옴
$.ajax({url:  country_api, dataType: "json",async: false,
        success: function(data){
            for(i=0;i<data.length;i++){
                countries_slug_list[i]=data[i].Slug;
                countries_name_list[i]=data[i].Country;
                countries_options += '<option value="' + countries_name_list[i] + '">' //받아온 나라별 name을 HTML Option 형식으로 바꿔서 저장
            }
            document.getElementById("countries").innerHTML = countries_options; // 저장한 옵션을 HTML에 입력
        }
    });

    var targets_country_confirmed = new Array();
var targets_country_active= new Array();
var targets_country_deaths= new Array();
var targets_country_recovered= new Array();

    for(i=0; i<3;i++){
      target_countries[i] = countries_slug_list[countries_name_list.indexOf(document.getElementById("country"+i+"_input").value)]; //입력받은 국가별 name값을 api를 받아올수 있는 slug값으로 변환해서 저장
      target_api[i] = main_api + target_countries[i] + "?from=" + target_time_start + "T00:00:00Z&to=" + target_time_end + "T00:00:00Z";
      $.ajax({url:  target_api[i], dataType: "json",async: false,
      success: function(data){
          var target_country_confirmed=[document.getElementById("country"+i+"_input").value]; //처음에 for문을 돌렸더니 마지막 ajax값만 들어가서 서로 다른 ajax을 여러번 사용했으나 저장할 배열을 ajax안에서 선언하니 해결됨
          var target_country_active=[document.getElementById("country"+i+"_input").value];
          var target_country_deaths=[document.getElementById("country"+i+"_input").value];
          var target_country_recovered=[document.getElementById("country"+i+"_input").value];
          for(k=1;k<=data.length;k++){
              target_country_confirmed[k]=data[k-1].Confirmed;
              target_country_active[k]=data[k-1].Active;
              target_country_deaths[k]=data[k-1].Deaths;
              target_country_recovered[k]=data[k-1].Recovered;
          }
          targets_country_confirmed[i]=target_country_confirmed;
          targets_country_active[i]=target_country_active;
          targets_country_deaths[i]=target_country_deaths;
          targets_country_recovered[i]=target_country_recovered;
          
      }
      
  });
    
      }

//그래프 X축에 들어갈 값들 입력
for(i=1;i<=diffDay;i++){
  date_item_x.setDate(date_item_x.getDate()+i-1)
  date_x[i]=getFormatDate(date_item_x).substring(2,11);
  date_item_x = new Date(target_time_start);
}


        var chart1 = c3.generate({
    
    bindto: "#linechart",
  
    data: {
    x : "date",
      columns: [
      date_x,
      targets_country_confirmed[0],
      targets_country_confirmed[1],
      targets_country_confirmed[2],
      ]
  
    },
    axis:{
        x : {
            type:"timeseries"
        }
    }
  
  });
for(i=0; i<3; i++){
  var chart2 = c3.generate({
    bindto: "#donutchart"+i,
    data: {
      columns: [
        ["Active",targets_country_active[i][targets_country_active[i].length-1]],
        ["Deaths",targets_country_deaths[i][targets_country_deaths[i].length-1]],
        ["Recovered",targets_country_recovered[i][targets_country_recovered[i].length-1]]
      ],
      type: "donut",
      colors:{Deaths:"#000000",Recovered:"#47C83E",Active:"#FF0000"},
      labels: {
        format: {
            y: d3.format(".1%"),
        }}
    },
    donut: {

      expand: false,
  
      title: document.getElementById("country"+i+"_input").value},
    axis: {
      x: {
        type: 'categorized',
        categories: ['Unique Click Rate','Total Click Rate']
      },
    },
    bar: {
      width: {
        ratio: 0.5,

      },
    }
  });

}
  

}