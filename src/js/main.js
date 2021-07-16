const create_query = (region, startDate, endDate, onlyLastData) => `query{
  regionalDataList(region:${region} startDate:${startDate} endDate:${endDate} lastData:${onlyLastData}){
    regionEng
    regionKor
    population
    covid19DataList{
      date
      confirmed{
        total
        accumlated
      }
      quarantine{
        total
        new{
          total
          domestic
          overseas
        }
      }
      recovered{
        total
        new
        accumlated
      }
      dead{
        total
        new
        accumlated
      }
      vaccinated{
        first{
          total
          new
          accumlated
        }
        second{
          total
          new
          accumlated
        }
      }
      per100kConfirmed
    }
  }
}`;

const covid19_API = (query, funtion) => {
  const APIworker = new Worker("./src/js/worker.js");
  APIworker.postMessage(query);
  APIworker.onmessage = (messageEvent) => {
    APIworker.terminate();
    funtion(messageEvent.data.regionalDataList);
  };
};

const create_list = () => {
  const query = `query{
  regionalDataList(onlyLastDate:true){
    regionEng
    regionKor
    covid19DataList{
      date
      confirmed{
        total
      }
      quarantine{
        total
        new{
          domestic
          overseas
          total
        }
      }
      vaccinated{
        first{
          total
        }
        second{
          total
        }
      }
      per100kConfirmed
      immunityRatio
    }
  }
}`;
  covid19_API(query, (regionalDataList) => {
    const regionList_ul = document.getElementById("list"),
      regionList = [],
      per100kConfirmedList = [],
      immunityRatio = [],
      newQuarantineList = {
        domestic: [],
        overseas: [],
      },
      vaccinatedList = {
        first: [],
        second: [],
      };

    regionalDataList.forEach((regionalData) => {
      const covid19Data = regionalData.covid19DataList[0];
      //사용할 데이터 분류
      {
        per100kConfirmedList.push(covid19Data.per100kConfirmed);
        immunityRatio.push(covid19Data.immunityRatio);
        newQuarantineList.domestic.push(covid19Data.quarantine.new.domestic);
        newQuarantineList.overseas.push(covid19Data.quarantine.new.overseas);
        vaccinatedList.first.push(covid19Data.vaccinated.first.total);
        vaccinatedList.second.push(covid19Data.vaccinated.second.total);
        regionList.push(regionalData.regionKor);
      }
      //지역 리스트 생성
      {
        const regionList_li = document.createElement("li");
        regionList_li.setAttribute("id", regionalData.regionEng);
        regionList_li.innerHTML = `
      <ul class="list_item">
        <li>${regionalData.regionKor}</li>
        <li>${covid19Data.quarantine.new.total.toLocaleString()}</li>
        <li>${covid19Data.quarantine.total.toLocaleString()}</li>
        <li>${covid19Data.confirmed.total.toLocaleString()}</li>
      </ul>`;
        regionList_ul.appendChild(regionList_li);
      }
    });

    //차트 생성
    {
      //10만명 당 확진 차트
      c3.generate({
        bindto: "#per100k_chart",
        padding: { left: 20, right: 20, top: 10, bottom: 10 },
        data: {
          json: {
            region: regionList.slice(1, 18),
            "10만명 당 확진자": per100kConfirmedList.slice(1, 18),
          },
          x: "region",
          type: "bar",
          colors: { "10만명 당 확진자": "#ff8151" },
        },
        axis: {
          x: {
            show: true,
            type: "category",
          },
          y: {
            show: false,
            tick: {
              format: (d) => d + " 명",
            },
          },
        },
        grid: {
          y: {
            lines: [
              {
                value: per100kConfirmedList[0],
                text: `전국 ${per100kConfirmedList[0]}명`,
              },
            ],
          },
        },
        point: {
          show: false,
        },
      });
      //신규 격리 차트
      c3.generate({
        bindto: "#newQuarantine_chart",
        padding: { left: 20, right: 20, top: 10, bottom: 10 },
        data: {
          json: {
            region: regionList.slice(1),
            해외: newQuarantineList.overseas.slice(1),
            국내: newQuarantineList.domestic.slice(1),
          },
          x: "region",
          type: "bar",
          groups: [["해외", "국내"]],
          colors: { 해외: "#e7604a", 국내: "#ff8151" },
        },
        axis: {
          x: {
            show: true,
            type: "category",
          },
          y: {
            show: false,
            tick: {
              format: (d) => d + " 명",
            },
          },
        },
        point: {
          show: false,
        },
      });
      //백신 접종 차트
      c3.generate({
        bindto: "#vaccinated_chart",
        padding: { left: 20, right: 20, top: 10, bottom: 10 },
        data: {
          json: {
            region: regionList.slice(1, 18),
            "1차 접종": vaccinatedList.first.slice(1, 18),
            "2차 접종": vaccinatedList.second.slice(1, 18),
          },
          x: "region",
          type: "bar",
          colors: { "1차 접종": "#2cabb1", "2차 접종": "#29c7ca" },
        },
        axis: {
          x: {
            show: true,
            type: "category",
          },
          y: {
            show: false,
            tick: {
              format: (d) => d + " 명",
            },
          },
        },
        point: {
          show: false,
        },
      });
      //면역 비율 차트
      c3.generate({
        bindto: "#immunityRatio_chart",
        padding: { left: 20, right: 20, top: 10, bottom: 10 },
        data: {
          json: {
            region: regionList.slice(1, 18),
            "면역 비율": immunityRatio.slice(1, 18),
          },
          x: "region",
          type: "bar",
          colors: { "면역 비율": "#29c7ca" },
        },
        axis: {
          x: {
            show: true,
            type: "category",
          },
          y: {
            max: 0.8,
            show: false,
            tick: {
              format: d3.format(".1%"),
            },
          },
        },
        grid: {
          y: {
            lines: [
              {
                value: 0.7,
                text: `집단면역 70%`,
              },
            ],
          },
        },
        gauge: {},
        point: {
          show: false,
        },
      });
    }
  });
};
const create_chart = (region, startDate, endDate) => {
  const query = `query{
  regionalDataList(region:${region} startDate:${startDate} endDate:${endDate}){
    regionEng
    regionKor
    population
    covid19DataList{
      date
      confirmed{
        total
        accumlated
      }
      quarantine{
        total
        new{
          total
          domestic
          overseas
        }
      }
      recovered{
        total
        new
        accumlated
      }
      dead{
        total
        new
        accumlated
      }
      vaccinated{
        first{
          total
          new
          accumlated
        }
        second{
          total
          new
          accumlated
        }
      }
      per100kConfirmed
      immunityRatio
    }
  }
}`;
  covid19_API(query, (regionalDataList) => {
    const covid19DataList = regionalDataList[0].covid19DataList;
    const lastData = covid19DataList[covid19DataList.length - 1];
    const chartData = {
      date: [],
      confirmed_total: [],
      confirmed_accumlated: [],
      quarantine_total: [],
      quarantine_new_total: [],
      quarantine_new_domestic: [],
      quarantine_new_overseas: [],
    };
    covid19DataList.forEach((covid19Data) => {
      chartData.date.push(covid19Data.date);
      chartData.confirmed_total.push(covid19Data.confirmed.total);
      chartData.confirmed_accumlated.push(covid19Data.confirmed.accumlated);
      chartData.quarantine_total.push(covid19Data.quarantine.total);
      chartData.quarantine_new_total.push(covid19Data.quarantine.new.total);
      chartData.quarantine_new_domestic.push(
        covid19Data.quarantine.new.domestic
      );
      chartData.quarantine_new_overseas.push(
        covid19Data.quarantine.new.overseas
      );
    });
    console.log(chartData);
    //지역 상세 정보 생성
    {
      const region_info = document.getElementById("region_info");
      region_info.innerHTML = `
    <span>${regionalDataList[0].regionKor} 상세정보</span>
    <table>
      <thead>
        <tr>
          <th>구분</th>
          <th colspan='3'>격리자</th>
          <th>회복자</th>
          <th>사망자</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td rowspan='2'>신규</td>
          <td rowspan='2'>${lastData.quarantine.new.total.toLocaleString()} 명</td>
          <td>해외</td>
          <td>${lastData.quarantine.new.overseas.toLocaleString()} 명</td>
          <td rowspan='2'>${lastData.recovered.new.toLocaleString()} 명</td>
          <td rowspan='2'>${lastData.dead.new.toLocaleString()} 명</td>
        </tr>
        <tr>
          <td>국내</td>
          <td>${lastData.quarantine.new.domestic.toLocaleString()} 명</td>
        </tr>
        <tr>
          <td>누적</td>
          <td colspan='3'>(확진) ${lastData.confirmed.accumlated.toLocaleString()} 명</td>
          <td>${lastData.recovered.accumlated.toLocaleString()} 명</td>
          <td>${lastData.dead.accumlated.toLocaleString()} 명</td>
        </tr>
        <tr>
          <td>전체</td>
          <td colspan='3'>${lastData.quarantine.total.toLocaleString()} 명</td>
          <td>${lastData.recovered.total.toLocaleString()} 명</td>
          <td>${lastData.dead.total.toLocaleString()} 명</td>
        </tr>
        <tr>
          <td>총 확진자</td>
          <td colspan='5'>${lastData.confirmed.total.toLocaleString()} 명</td>
        </tr>
      </tbody>
    </table>
    `;
    }
    //차트 생성
    {
      //확진자 비율 차트
      c3.generate({
        bindto: "#confirmedRatio_chart",
        data: {
          columns: [
            ["격리", lastData.quarantine.total],
            ["사망", lastData.dead.total],
            ["회복", lastData.recovered.total],
          ],
          type: "donut",
          colors: {
            사망: "#353942",
            회복: "#29c7ca",
            격리: "#ff8151",
          },
          labels: {
            format: {
              y: d3.format(".1%"),
            },
          },
        },
        donut: {
          expand: false,
          title: "확진자 상태 비율",
        },
        axis: {
          x: {
            type: "categorized",
          },
        },
      });
      //집단 면역 비율 차트
      c3.generate({
        bindto: "#collectiveImmunityRatio_chart",
        data: {
          columns: [["면역자 비율", lastData.dead.total]],
          type: "gauge",
        },
        gauge: {
          max: lastData.confirmed.total,
          expand: false,
        },
      });

      //확진자 그래프
      c3.generate({
        bindto: "#total_confirmed_chart",
        padding: { left: 20, right: 20, top: 10, bottom: 10 },
        data: {
          json: {
            date: chartData.date,
            확진: chartData.confirmed_total,
          },
          x: "date",
          type: "area-spline",
        },
        legend: {
          hide: true,
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
      //신규 확진자 그래프
      c3.generate({
        bindto: "#new_confirmed_chart",
        padding: { left: 20, right: 20, top: 10, bottom: 10 },
        data: {
          json: {
            date: chartData.date,
            "국내 감염": chartData.quarantine_new_domestic,
            "해외 감염": chartData.quarantine_new_overseas,
            전체: chartData.quarantine_new_total,
          },
          groups: [["국내 감염", "해외 감염"]],
          x: "date",
          types: {
            "국내 감염": "area-spline",
            "해외 감염": "area-spline",
            전체: "spline",
          },
          onmouseover: function (d) {
            if (d.name === "전체") {
              console.log(d);
            }
          },
        },
        legend: {
          hide: true,
        },
        axis: {
          x: {
            show: true,
            type: "timeseries",
            tick: {
              multiline: false,
              format: "%y.%m.%d",
              fit: true,
              outer: false,
              centered: true,
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
    }
  });
};

create_list();
create_chart("Total", 20210101, 20210701);
const convert_date_format = (input_date, form) => {
    const num2str = (num) => (num < 10 ? "0" + num : String(num)),
      date = new Date(input_date),
      year = date.getFullYear(), //yyyy
      month = num2str(1 + date.getMonth()), //M
      day = num2str(date.getDate());
    return year + form + month + form + day;
  },
  string2date = (string_date) => {
    const strArr = string_date.split("-");
    const numArr = [];
    for (let i = 0; i < 3; i++) {
      numArr[i] = Number(strArr[i]);
    }
    const date = new Date(numArr[0], numArr[1] - 1, numArr[2]);
    return date;
  },
  //queryString으로 받은 값과 비교하기 위한 형식으로변환 ex:20210326
  date2query_form = (date) => Number(convert_date_format(date, ""));
