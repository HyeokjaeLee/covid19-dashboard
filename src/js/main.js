const today = new Date();

/**dynamic element들의 기준이 되는 정보*/
const target = {
  region: "Total",
  startDate: 0,
  endDate: convert_date(today),
};
const main = () => {
  create_static_elements();
  create_dynamic_elements(target.region, target.startDate, target.endDate);
};

function change_data(_target) {
  if (typeof _target === "string") target.region = _target;
  else
    target.startDate = !!_target ? convert_date(minus_date(today, _target)) : 0;
  create_dynamic_elements(target.region, target.startDate, target.endDate);
}

/**정적 데이터를 사용하는 element 업데이트
 * 첫 페이지 로딩시에만 호출
 */
function create_static_elements() {
  const startDate = convert_date(minus_date(today, 8));
  const endDate = convert_date(today);
  const query = `query{
    regionalDataList(startDate:${startDate} endDate:${endDate}){
      regionEng
      regionKor
      population
      distancingLevel
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
    /**element를 생성하는 필요한 데이터 공간*/
    const elementData = {
      regionList: [],
      per100kConfirmedList: [],
      immunityRatio: [],
      newQuarantineList: {
        domestic: [],
        overseas: [],
      },
      vaccinatedList: {
        first: [],
        second: [],
      },
      per100kAverage: [],
    };

    const regionList_ul = document.getElementById("list");
    /**데이터를 분류하고 동시에 지역 List element를 생성하기 위한 루프*/
    regionalDataList.forEach((regionalData) => {
      const covid19Data = regionalData.covid19DataList;
      const lastCovid19Data = covid19Data[covid19Data.length - 1];

      //사용할 데이터 분류
      {
        elementData.per100kConfirmedList.push(lastCovid19Data.per100kConfirmed);
        elementData.immunityRatio.push(lastCovid19Data.immunityRatio);
        elementData.newQuarantineList.domestic.push(
          lastCovid19Data.quarantine.new.domestic
        );
        elementData.newQuarantineList.overseas.push(
          lastCovid19Data.quarantine.new.overseas
        );
        elementData.vaccinatedList.first.push(
          lastCovid19Data.vaccinated.first.total
        );
        elementData.vaccinatedList.second.push(
          lastCovid19Data.vaccinated.second.total
        );
      }

      //지역 리스트 생성
      {
        const regionList_li = document.createElement("li");
        regionList_li.setAttribute("id", regionalData.regionEng);
        const regionName = regionalData.regionKor;
        const distancingLevel =
          regionName != "검역"
            ? regionalData.distancingLevel + " 단계"
            : "Null";
        regionList_li.setAttribute(
          "onClick",
          `change_data("${regionalData.regionEng}")`
        );
        //수치 상으로는 일치하지만 마지막 li의 오른쪽 여백이 살짝 부족한것 처럼 느껴저서 2px를 더해줌
        regionList_li.innerHTML = `
        <ul class="list_item">
          <li>${regionalData.regionKor}</li>
          <li>${lastCovid19Data.quarantine.new.total.toLocaleString()}</li>
          <li>${lastCovid19Data.confirmed.total.toLocaleString()}</li>
          <li style="padding-right:2px">${distancingLevel}</li>
        </ul>`;
        regionList_ul.appendChild(regionList_li);
      }

      /**지역 구분이 검역이나 전국*/
      if (
        regionalData.regionKor != "검역" &&
        regionalData.regionKor != "전국"
      ) {
        const last7daysCovid19DataList = covid19Data.slice(-7);
        const quarantineNewTotalList = last7daysCovid19DataList.map(
          (covid19Data) => covid19Data.quarantine.new.total
        );
        elementData.regionList.push(regionalData.regionKor);
        const sum = quarantineNewTotalList.reduce(
          (sum, currValue) => sum + currValue,
          0
        );
        const average = sum / quarantineNewTotalList.length;
        const per100kAverage =
          Math.round(average * (100000 / regionalData.population) * 10) / 10;
        elementData.per100kAverage.push(per100kAverage);
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
            region: elementData.regionList.slice(1, 18),
            "10만명 당 확진자": elementData.per100kConfirmedList.slice(1, 18),
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
              format: (d) => d + "명",
            },
          },
        },
        grid: {
          y: {
            lines: [
              {
                value: elementData.per100kConfirmedList[0],
                text: `전국 ${elementData.per100kConfirmedList[0]}명`,
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
            region: elementData.regionList.slice(1),
            해외: elementData.newQuarantineList.overseas.slice(1),
            국내: elementData.newQuarantineList.domestic.slice(1),
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
            region: elementData.regionList.slice(1, 18),
            "1차 접종": elementData.vaccinatedList.first.slice(1, 18),
            "2차 접종": elementData.vaccinatedList.second.slice(1, 18),
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
            region: elementData.regionList.slice(1, 18),
            "면역 비율": elementData.immunityRatio.slice(1, 18),
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
        point: {
          show: false,
        },
      });

      c3.generate({
        bindto: "#per100k_7d_chart",
        padding: { left: 25, right: 25, top: 10, bottom: 10 },
        data: {
          json: {
            region: elementData.regionList.slice(1, 18),
            확진: elementData.per100kAverage,
          },
          x: "region",
          type: "bar",
          color: (color, d) => {
            color =
              d.value >= 4
                ? "#ff8151"
                : d.value >= 2
                ? "#FFA17D"
                : d.value >= 1
                ? "#FFB27D"
                : "#29C7CA";
            return color;
          },
        },
        legend: {
          hide: true,
        },
        axis: {
          x: {
            show: true,
            type: "category",
          },

          y: {
            show: true,
            tick: {
              outer: false,
              values: [1, 2, 4],
              format: (d) => d + "명",
            },
          },
        },
        grid: {
          y: {
            lines: [
              {
                value: 1,
                text: "거리두기 2단계",
                position: "middle",
                class: "distancingLevelLine",
              },
              {
                value: 2,
                text: "거리두기 3단계",
                position: "middle",
                class: "distancingLevelLine",
              },
              {
                value: 4,
                text: "거리두기 4단계",
                position: "middle",
                class: "distancingLevelLine",
              },
            ],
          },
        },
      });
    }

    const loading_div = document.getElementById("loading");
    loading_div.parentElement.removeChild(loading_div);
  });
}

const create_dynamic_elements = (region, startDate, endDate) => {
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
      dead_new: [],
      dead_accumlated: [],
      recovered_total: [],
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
      chartData.recovered_total.push(covid19Data.recovered.total);
      chartData.dead_new.push(covid19Data.dead.new);
      chartData.dead_accumlated.push(covid19Data.dead.accumlated);
    });
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
      const axisXcount =
        chartData.date.length < 30 ? chartData.date.length : 30;
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
            격리해제: chartData.recovered_total,
          },
          x: "date",
          type: "area-spline",
        },
        axis: {
          x: {
            show: true,
            type: "timeseries",
            tick: {
              format: "%y.%m.%d",
              fit: true,
              outer: false,
              count: axisXcount,
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
              count: axisXcount,
            },
          },
          y: {
            show: false,
          },
        },
        grid: {
          y: {
            lines: [
              {
                value: 500,
                text: "거리두기 2단계",
                position: "start",
              },
              {
                value: 1000,
                text: "거리두기 3단계",
                position: "start",
              },
              {
                value: 2000,
                text: "거리두기 4단계",
                position: "start",
              },
            ],
          },
        },
        point: {
          show: false,
        },
      });

      //통합 차트
      c3.generate({
        bindto: "#integration_chart",
        padding: { left: 20, right: 20, top: 10, bottom: 10 },
        data: {
          json: {
            date: chartData.date,
            "신규 확진(국내)": chartData.quarantine_new_domestic,
            "신규 확진(해외)": chartData.quarantine_new_overseas,
            "누적 사망": chartData.dead_accumlated,
            "신규 사망": chartData.dead_new,
            "누적 확진": chartData.confirmed_accumlated,
            격리해제: chartData.recovered_total,
          },
          groups: [
            [
              "신규 확진(국내)",
              "신규 확진(해외)",
              "누적 사망",
              "신규 사망",
              "누적 확진",
            ],
          ],
          order: "asc",
          x: "date",
          types: {
            "신규 확진(국내)": "area-spline",
            "신규 확진(해외)": "area-spline",
            "누적 사망": "area-spline",
            "신규 사망": "area-spline",
            "누적 확진": "area-spline",
            격리해제: "spline",
          },
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
              count: axisXcount,
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

/**날짜 형식 숫자로 변경
 * @param date 날짜 "2021-05-01"
 * @returns 20210501
 */
function convert_date(date) {
  date = new Date(date);
  const num2str = (num) => (num < 10 ? "0" + num : String(num)),
    year = String(date.getFullYear()), //yyyy
    month = num2str(1 + date.getMonth()), //M
    day = num2str(date.getDate());
  return Number(year + month + day);
}

/**Web worker에서 코로나 API 정보를 받아옴
 * @param query 필요한 정보를 요청할 Query
 * @param function 응답 받은 json 데이터를 활용하는 함수
 */
function covid19_API(query, funtion) {
  const APIworker = new Worker("./src/js/worker.js");
  APIworker.postMessage(query);
  APIworker.onmessage = (messageEvent) => {
    APIworker.terminate();
    funtion(messageEvent.data.regionalDataList);
  };
}

/**기준 날짜에서 원하는 일수를 뺀 날짜
 * @param date 기준 날짜
 * @param num 뺄 일수
 */
function minus_date(date, num) {
  date = new Date(date);
  date.setDate(date.getDate() - num);
  return date;
}

main();
