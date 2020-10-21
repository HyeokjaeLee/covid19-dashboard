function getFormatDate(date){
    var year = date.getFullYear();              //yyyy
    var month = (1 + date.getMonth());          //M
    month = month >= 10 ? month : '0' + month;  //month 두자리로 저장
    var day = date.getDate();                   //d
    day = day >= 10 ? day : '0' + day;          //day 두자리로 저장
    return  year + '-' + month + '-' + day;       //'-' 추가하여 yyyy-mm-dd 형태 생성 가능
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
var target_countries = new Array(6);


var target_time_start = document.getElementById("target_time_start").value;
var target_time_end = document.getElementById("target_time_end").value;
var date1 = new Date(target_time_start);
var date2 = new Date(target_time_end);
var diffDay = (date2.getTime()-date1.getTime()) / (1000*60*60*24)+1;
var date_item_x = date1;
var date_x = ["date"];
var target0_country_case = new Array();
var target1_country_case = new Array();
var target2_country_case = new Array();
var target3_country_case = new Array();
var target4_country_case = new Array();
var target5_country_case = new Array();
var targets_country_case = new Array();

var target0_country_recover = new Array();
var target0_country_deaths = new Array();


for(i=1;i<=diffDay;i++){
    date_item_x.setDate(date_item_x.getDate()+i-1)
    date_x[i]=getFormatDate(date_item_x).replace(/-/g,'').substring(4,8);
    date_item_x = new Date(target_time_start);
}



$.ajax({url:  country_api, dataType: "json",async: false,
        success: function(data){
            for(i=0;i<data.length;i++){
                countries_slug_list[i]=data[i].Slug;
                countries_name_list[i]=data[i].Country;
                countries_options += '<option value="' + countries_name_list[i] + '">'
            }
            document.getElementById("countries").innerHTML = countries_options;
        }
    });


for(i=0; i<6; i++){
    target_countries[i] = countries_slug_list[countries_name_list.indexOf(document.getElementById("country"+i+"_input").value)];
    }


for(k=0; k<6; k++){
    target_api[k] = main_api + target_countries[k] + "/status/confirmed?from=" + target_time_start + "T00:00:00Z&to=" + target_time_end + "T00:00:00Z";}



    $.ajax({url:  target_api[0], dataType: "json",async: false,
        success: function(data){
            target0_country_case[0]=target_countries[0]+"_cases";
            for(i=1;i<=diffDay;i++){
                target0_country_case[i]=data[i-1].Cases;
            }
            targets_country_case[0]=target0_country_case;
        }
    });
    $.ajax({url:  target_api[1], dataType: "json",async: false,
        success: function(data){
            target1_country_case[0]=target_countries[1]+"_cases";
            for(i=1;i<=diffDay;i++){
                target1_country_case[i]=data[i-1].Cases;
            }
            targets_country_case[1]=target1_country_case;
        }
    });
    $.ajax({url:  target_api[2], dataType: "json",async: false,
        success: function(data){
            target2_country_case[0]=target_countries[2]+"_cases";
            for(i=1;i<=diffDay;i++){
                target2_country_case[i]=data[i-1].Cases;
            }
            targets_country_case[2]=target2_country_case;
        }
    });
    $.ajax({url:  target_api[3], dataType: "json",async: false,
        success: function(data){
            target3_country_case[0]=target_countries[3]+"_cases";
            for(i=1;i<=diffDay;i++){
                target3_country_case[i]=data[i-1].Cases;
            }
            targets_country_case[3]=target3_country_case;
        }
    });
    $.ajax({url:  target_api[4], dataType: "json",async: false,
        success: function(data){
            target4_country_case[0]=target_countries[4]+"_cases";
            for(i=1;i<=diffDay;i++){
                target4_country_case[i]=data[i-1].Cases;
            }
            targets_country_case[4]=target4_country_case;
        }
    });
    $.ajax({url:  target_api[5], dataType: "json",async: false,
        success: function(data){
            target5_country_case[0]=target_countries[5]+"_cases";
            for(i=1;i<=diffDay;i++){
                target5_country_case[i]=data[i-1].Cases;
            }
            targets_country_case[5]=target5_country_case;
        }
    });

    $.ajax({url:  target_api[0].replace("/status/confirmed",""), dataType: "json",async: false,
    success: function(data){
        target0_country_recover[0]="Recovered";
        target0_country_deaths[0]="Deaths";
        for(i=1;i<=diffDay;i++){
            target0_country_recover[i]=data[i-1].Recovered;
            target0_country_deaths[i]=data[i-1].Deaths;
        }
    }
});
var world_new_confirmed = [];
var world_new_deaths =[];
var world_total_confirmed=0;
var world_total_active=0;
var world_total_recovered=0;
var world_total_deaths=0;
var test2;
$.ajax({url:  "https://api.covid19api.com/world", dataType: "json",async: false,
success: function(data){
    test2=data.length;
    world_new_confirmed[0]="Confirmed";
    world_new_deaths[0]="Deaths";
    world_total_deaths=data[data.length-1].TotalDeaths;
    world_total_recovered=data[data.length-1].TotalRecovered;
    world_total_confirmed=data[data.length-1].TotalConfirmed;
    world_total_active=world_total_confirmed- world_total_recovered- world_total_deaths;
    for(i=1;i<=data.length+1;i++){
        world_new_confirmed[i]=data[i-1].NewConfirmed;
        world_new_deaths[i]=data[i-1].NewDeaths;
    }
}
});
document.getElementById("test").textContent=world_total_active;
        var chart1 = c3.generate({
    
    bindto: "#linechart",
  
    data: {
    x : "date",
      columns: [
      date_x,
      targets_country_case[0],
      targets_country_case[1],
      targets_country_case[2],
      targets_country_case[3],
      targets_country_case[4],
      targets_country_case[5]
      ]
  
    },
    axis:{
        x : {
            type:"category"
        }
    }
  
  });

  var chart2 = c3.generate({

    bindto: "#areachart",
  
    data: {
        x : "date",
      columns: [
        date_x,
        targets_country_case[0],  
  
        target0_country_recover,
  
        target0_country_deaths
  
  ],
  
      types: {
  
        Recovered: 'area-spline',
  
        Deaths: 'area-spline',
  
      },
      colors:{
        Recovered:"#1DDB16",
        Deaths:"#000000"
      }
  
    },
    axis:{
        x : {
            type:"category"
        }
    },
    point : {
        show: false
    }
  
  });
  var chart3 = c3.generate({
    bindto: "#worldchart1",
    data: {
      columns: [
        ['Active', world_total_active],
        ['Deaths', world_total_deaths],
        ['Recovered',world_total_recovered]
      ],
      type: "donut",
      labels: {
        format: {
            y: d3.format(".1%"),
        }}
    },
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

  var chart3 = c3.generate({
    bindto: "#worldchart2",
    data: {
      columns: [
        ['Active', world_total_active],
        ['Deaths', world_total_deaths],
        ['Recovered',world_total_recovered]
      ],
      type: "donut",
      labels: {
        format: {
            y: d3.format(".1%"),
        }}
    },
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

  var chart4 = c3.generate({

    bindto: "#worldchart3",
  
    data: {
      columns: [
        world_new_deaths,
        world_new_confirmed
  
  ],
  
      types: {
  
        Confirmed: 'area-spline',
  
        Deaths: 'area-spline',
  
      },
      colors:{
        Confirmed:"RED",
        Deaths:"#000000"
      }
  
    },
    axis:{
        y : {
            max: 300000,
            min: 0,
            padding: {top:0,bottom:0}
        }
    },
    point : {
        show: false
    }
  
  });
}