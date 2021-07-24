const today = new Date();
const chartLoading = document.getElementById("chartLoading");
const toLocalString = (number) => (number != null ? number.toLocaleString() : number);
/**dynamic element들의 기준이 되는 정보*/
const target = {
  region: "Total",
  startDate: 0,
  endDate: convert_date(today),
};

const better = "#2CABB1",
  good = "#29C7CA",
  normal = "#353942",
  bad = "#FF8151",
  worse = "#E7604A";

/**c3차트 생성 공통 데이터*/

const commonPadding = { left: 20, right: 20, top: 10, bottom: 10 },
  commonFormat = (d) => toLocalString(d) + " 명",
  commonAxis = {
    x: {
      show: true,
      type: "category",
    },
    y: {
      show: false,
      tick: {
        format: commonFormat,
      },
    },
  };

const main = (() => {
  create_static_elements();
  create_dynamic_elements(target.region, target.startDate, target.endDate);
})();

/*사용할 함수 선언*/

function change_data(_target) {
  chartLoading.style.display = "block";
  if (typeof _target === "string") target.region = _target;
  else target.startDate = !!_target ? convert_date(minus_date(today, _target)) : 0;
  create_dynamic_elements(target.region, target.startDate, target.endDate);
}

/**정적 데이터를 사용하는 element 업데이트
 * 첫 페이지 로딩시에만 호출
 */
async function create_static_elements() {
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
          new{
            domestic
            overseas
            total
          }
        }
        vaccinated{
          first{
            new
            total
          }
          second{
            new
            total
          }
        }
        per100kConfirmed
        immunityRatio
      }
    }
  }`;
  const regionalDataList = await covid19_API(query);
  /**차트 생성을 위한 데이터*/
  const chartData = {
    regionList: [],
    vaccination: {
      _1st: {
        new: [],
        total: [],
      },
      _2nd: {
        new: [],
        total: [],
      },
    },
    confirmedCase: {
      total: [],
    },
    quarantine: {
      new: {
        domestic: [],
        overseas: [],
        total: [],
      },
    },
    confirmedCasePer100k: {
      new: [],
      newAverage7Days: [],
      total: [],
    },
    immunityRatio: [],
  };
  const regionList_ul = document.getElementById("list"),
    estimatedIncreasing_list = document.getElementById("estimatedIncreasing_list"),
    estimatedDecreasing_list = document.getElementById("estimatedDecreasing_list");

  /**인구 10만명당 대상 수
   * @param num 대상 수
   * @param population 인구 수
   * @returns 10만명당 수
   */

  /**데이터를 분류하고 동시에 지역 List element를 생성하기 위한 루프*/
  regionalDataList.forEach((regionalData) => {
    {
      const covid19DataList = regionalData.covid19DataList.slice(-7);
      const lastCovid19APIdata = covid19DataList[covid19DataList.length - 1];
      //지역 리스트 item 생성 및 추가
      {
        const regionList_li = document.createElement("li");
        regionList_li.setAttribute("id", regionalData.regionEng);
        regionList_li.setAttribute(
          "onClick",
          `change_data("${regionalData.regionEng}"); location.href='#regionChartsLine'`
        );
        const unitTxt = regionalData.distancingLevel != null ? " 단계" : "";
        regionList_li.innerHTML = `
              <ul class="list_item">
                <li>${regionalData.regionKor}</li>
                <li>${toLocalString(lastCovid19APIdata.quarantine.new.total)}</li>
                <li>${toLocalString(lastCovid19APIdata.confirmed.total)}</li>
                <li>${regionalData.distancingLevel + unitTxt}</li>
              </ul>`;
        regionList_ul.appendChild(regionList_li);
      }
      //차트 생성에 '검역' 데이터는 사용하지 않음
      if (regionalData.regionKor != "검역") {
        const count_per100k = (num) =>
          Math.round(num * (100000 / regionalData.population) * 100) / 100;
        let newConfirmedAverage7DaysPer100k = null;
        if (regionalData.regionKor != "전국") {
          let newConfirmedCase7DaySum = 0;
          covid19DataList.forEach((covid19Data) => {
            newConfirmedCase7DaySum += covid19Data.quarantine.new.total;
          });
          const newConfirmedCase7DayAverage = newConfirmedCase7DaySum / covid19DataList.length;
          newConfirmedAverage7DaysPer100k = count_per100k(newConfirmedCase7DayAverage);
          const estimatedDistancingLv =
            newConfirmedAverage7DaysPer100k >= 4
              ? 4
              : newConfirmedAverage7DaysPer100k >= 2
              ? 3
              : newConfirmedAverage7DaysPer100k >= 1
              ? 2
              : 1;
          const differenceEstimatedDistancingLv =
            estimatedDistancingLv - regionalData.distancingLevel;
          const unitTxt = differenceEstimatedDistancingLv > 0 ? "+" : "";
          const li = document.createElement("li"),
            span = document.createElement("span");
          li.append(
            `${regionalData.regionKor}: ${regionalData.distancingLevel} > ${estimatedDistancingLv} 단계`
          );
          span.append(unitTxt + differenceEstimatedDistancingLv);
          li.append(span);
          if (differenceEstimatedDistancingLv < 0) {
            estimatedDecreasing_list.append(li);
          } else if (differenceEstimatedDistancingLv > 0) {
            estimatedIncreasing_list.append(li);
          }
        }
        chartData.immunityRatio.push(lastCovid19APIdata.immunityRatio);
        chartData.regionList.push(regionalData.regionKor);
        chartData.confirmedCase.total.push(lastCovid19APIdata.confirmed.total);
        /**API의 신규 격리 데이터 shallow copy*/
        const newQuarantineData = lastCovid19APIdata.quarantine.new;
        chartData.quarantine.new.domestic.push(newQuarantineData.domestic);
        chartData.quarantine.new.overseas.push(newQuarantineData.overseas);
        chartData.quarantine.new.total.push(newQuarantineData.total);
        /**API의 백신접종 데이터 shallow copy*/
        const vaccinationData = lastCovid19APIdata.vaccinated;
        chartData.vaccination._1st.new.push(vaccinationData.first.new);
        chartData.vaccination._1st.total.push(vaccinationData.first.total);
        chartData.vaccination._2nd.new.push(vaccinationData.second.new);
        chartData.vaccination._2nd.total.push(vaccinationData.second.total);

        chartData.confirmedCasePer100k.newAverage7Days.push(newConfirmedAverage7DaysPer100k);
        chartData.confirmedCasePer100k.new.push(count_per100k(newQuarantineData.total));
        chartData.confirmedCasePer100k.total.push(lastCovid19APIdata.per100kConfirmed);
      }
    }
  });

  //차트 생성
  {
    const actualRegionList = chartData.regionList.slice(1);
    /**7일 평균 10만명당 신규 확진자 차트*/
    const newConfirmedCaseAverage7Days_bar = c3.generate({
      bindto: "#newConfirmedCaseAverage7Days_bar",
      padding: commonPadding,
      data: {
        json: {
          region: actualRegionList,
          확진: chartData.confirmedCasePer100k.newAverage7Days.slice(1),
        },
        x: "region",
        type: "bar",
        colors: { 확진: good },
        color: (color, d) => (d.value >= 4 ? bad : d.value >= 1 ? normal : color),
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
            format: commonFormat,
          },
        },
      },
      grid: {
        y: {
          lines: [
            {
              value: 1,
              text: "거리두기 2단계",
              class: "distancingLevelLine",
            },
            {
              value: 2,
              text: "거리두기 3단계",
              class: "distancingLevelLine",
            },
            {
              value: 4,
              text: "거리두기 4단계",
              class: "distancingLevelLine",
            },
          ],
        },
      },
    });

    /**10만명당 신규 확진자 차트*/
    const newConfirmedCasePer100k_bar = c3.generate({
      bindto: "#newConfirmedCasePer100k_bar",
      padding: commonPadding,
      data: {
        json: {
          region: actualRegionList,
          확진: chartData.confirmedCasePer100k.new.slice(1),
        },
        x: "region",
        type: "bar",
        colors: { 확진: normal },
        color: (color, d) => (d.value >= chartData.confirmedCasePer100k.new[0] ? bad : color),
      },
      legend: {
        hide: true,
      },
      axis: commonAxis,
      grid: {
        y: {
          lines: [
            {
              value: chartData.confirmedCasePer100k.new[0],
              text: `전국 ${chartData.confirmedCasePer100k.new[0]}명`,
            },
          ],
        },
      },
    });

    /**인구 10만명당 누적 확진자 차트*/
    const totalConfirmedCasePer100k_bar = c3.generate({
      bindto: "#totalConfirmedCasePer100k_bar",
      padding: commonPadding,
      data: {
        json: {
          region: actualRegionList,
          확진: chartData.confirmedCasePer100k.total.slice(1),
        },
        x: "region",
        type: "bar",
        colors: { 확진: normal },
        color: (color, d) => (d.value >= chartData.confirmedCasePer100k.total[0] ? bad : color),
      },
      legend: {
        hide: true,
      },
      axis: commonAxis,
      grid: {
        y: {
          lines: [
            {
              value: chartData.confirmedCasePer100k.total[0],
              text: `전국 ${chartData.confirmedCasePer100k.total[0]}명`,
            },
          ],
        },
      },
    });

    /**신규 확진자 차트*/
    const newConfirmedCase_bar = c3.generate({
      bindto: "#newConfirmedCase_bar",
      padding: commonPadding,
      data: {
        json: {
          region: actualRegionList,
          해외: chartData.quarantine.new.overseas.slice(1),
          국내: chartData.quarantine.new.domestic.slice(1),
        },
        x: "region",
        type: "bar",
        groups: [["해외", "국내"]],
        colors: { 해외: bad, 국내: normal },
      },
      axis: commonAxis,
    });

    /**누적 확진자 차트*/
    const totalConfirmedCase_bar = c3.generate({
      bindto: "#totalConfirmedCase_bar",
      padding: commonPadding,
      data: {
        json: {
          region: actualRegionList,
          확진: chartData.confirmedCase.total.slice(1),
        },
        x: "region",
        type: "bar",
        colors: { 확진: normal },
      },
      legend: {
        hide: true,
      },
      axis: commonAxis,
    });

    /**신규 백신 접종자 차트*/
    const newVaccination_bar = c3.generate({
      bindto: "#newVaccination_bar",
      padding: commonPadding,
      data: {
        json: {
          region: actualRegionList,
          "1차 접종": chartData.vaccination._1st.new.slice(1),
          "2차 접종": chartData.vaccination._2nd.new.slice(1),
        },
        x: "region",
        type: "bar",
        colors: { "1차 접종": good, "2차 접종": better },
      },
      axis: commonAxis,
    });

    /**누적 백신 접종자 차트*/
    c3.generate({
      bindto: "#totalVaccination_bar",
      padding: commonPadding,
      data: {
        json: {
          region: actualRegionList,
          "1차 접종": chartData.vaccination._1st.total.slice(1),
          "2차 접종": chartData.vaccination._2nd.total.slice(1),
        },
        x: "region",
        type: "bar",
        colors: { "1차 접종": good, "2차 접종": better },
      },
      axis: commonAxis,
    });

    /**면역자 비율 차트*/
    c3.generate({
      bindto: "#immunityRatio_bar",
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
      data: {
        json: {
          region: chartData.regionList,
          "면역 비율": chartData.immunityRatio,
        },
        x: "region",
        type: "bar",
        colors: { "면역 비율": better },
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
    });
  }
  const updatedDate = document.getElementById("updatedDate");
  updatedDate.innerHTML = `Update: ${
    regionalDataList[0].covid19DataList[regionalDataList[0].covid19DataList.length - 1].date
  }`;
}

async function create_dynamic_elements(region, startDate, endDate) {
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
  const lazarettoVaccinationText = "해당지역은 백신 접종 정보를<br>제공하지 않습니다.";
  const regionalDataList = await covid19_API(query);
  const covid19DataList = regionalDataList[0].covid19DataList;
  const lastData = covid19DataList[covid19DataList.length - 1];
  const elementData = {
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
    vaccinated_first_new: [],
    vaccinated_second_new: [],
    vaccinated_first_total: [],
    vaccinated_second_total: [],
    covid19Data: {
      dead: {
        total: [],
      },
    },
  };
  covid19DataList.forEach((covid19Data) => {
    elementData.date.push(covid19Data.date);
    elementData.confirmed_total.push(covid19Data.confirmed.total);
    elementData.confirmed_accumlated.push(covid19Data.confirmed.accumlated);
    elementData.quarantine_total.push(covid19Data.quarantine.total);
    elementData.quarantine_new_total.push(covid19Data.quarantine.new.total);
    elementData.quarantine_new_domestic.push(covid19Data.quarantine.new.domestic);
    elementData.quarantine_new_overseas.push(covid19Data.quarantine.new.overseas);
    elementData.recovered_total.push(covid19Data.recovered.total);
    elementData.dead_new.push(covid19Data.dead.new);
    elementData.covid19Data.dead.total.push(covid19Data.dead.total);
    elementData.vaccinated_first_total.push(covid19Data.vaccinated.first.total);
    elementData.vaccinated_second_total.push(covid19Data.vaccinated.second.total);
    elementData.vaccinated_first_new.push(covid19Data.vaccinated.first.new);
    elementData.vaccinated_second_new.push(covid19Data.vaccinated.second.new);
  });
  //지역 상세 정보 생성
  {
    const regionInfo_table = document.getElementById("regionInfo_table");
    regionInfo_table.innerHTML = `
    <div>${regionalDataList[0].regionKor} 상세정보</div>
    <br>
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
          <td rowspan='2'>${toLocalString(lastData.quarantine.new.total)} 명</td>
          <td>해외</td>
          <td>${toLocalString(lastData.quarantine.new.overseas)} 명</td>
          <td rowspan='2'>${toLocalString(lastData.recovered.new)} 명</td>
          <td rowspan='2'>${toLocalString(lastData.dead.new)} 명</td>
        </tr>
        <tr>
          <td>국내</td>
          <td>${toLocalString(lastData.quarantine.new.domestic)} 명</td>
        </tr>
        <tr>
          <td>누적</td>
          <td colspan='3'>(확진) ${toLocalString(lastData.confirmed.accumlated)} 명</td>
          <td>${toLocalString(lastData.recovered.accumlated)} 명</td>
          <td>${toLocalString(lastData.dead.accumlated)} 명</td>
        </tr>
        <tr>
          <td>전체</td>
          <td colspan='3'>${toLocalString(lastData.quarantine.total)} 명</td>
          <td>${toLocalString(lastData.recovered.total)} 명</td>
          <td>${toLocalString(lastData.dead.total)} 명</td>
        </tr>
        <tr>
          <td>총 확진자</td>
          <td colspan='5'>${toLocalString(lastData.confirmed.total)} 명</td>
        </tr>
      </tbody>
    </table>
    `;
  }
  //차트 생성
  {
    const axisXcount = elementData.date.length < 30 ? elementData.date.length : 30;
    /**확진자 상태 비율 차트*/
    const confirmedRatio_donut = c3.generate({
      bindto: "#confirmedRatio_donut",
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

    if (regionalDataList[0].regionKor === "검역") {
      const vaccination1st_txt = document.getElementById("vaccination1st_txt");
      const vaccination2nd_txt = document.getElementById("vaccination2nd_txt");
      const vaccination2ndRate_gauge = document.getElementById("vaccination2ndRate_gauge");
      const newVaccination_spline = document.getElementById("newVaccination_spline");
      const totalVaccination_areaSpline = document.getElementById("totalVaccination_areaSpline");
      vaccination2ndRate_gauge.innerHTML = "";
      newVaccination_spline.innerHTML = `<br><br><br>${lazarettoVaccinationText}`;
      totalVaccination_areaSpline.innerHTML = `<br><br><br>${lazarettoVaccinationText}`;
      vaccination1st_txt.innerHTML = "검역";
      vaccination2nd_txt.innerHTML = lazarettoVaccinationText;
    } else {
      const lastVaccinatedFirstTotal =
        elementData.vaccinated_first_total[elementData.vaccinated_first_total.length - 1];
      const lastVaccinatedSecondTotal =
        elementData.vaccinated_second_total[elementData.vaccinated_second_total.length - 1];

      vaccination1st_txt.innerHTML = `1차 백신 접종: ${toLocalString(lastVaccinatedFirstTotal)} 명`;
      vaccination2nd_txt.innerHTML = `2차 백신 접종: ${toLocalString(
        lastVaccinatedSecondTotal
      )} 명`;

      const vaccination2ndRate_gauge = c3.generate({
        bindto: "#vaccination2ndRate_gauge",
        data: {
          columns: [["면역자 비율", lastVaccinatedSecondTotal]],
          type: "gauge",
        },
        gauge: {
          max: regionalDataList[0].population,
          expand: false,
          label: {
            show: false,
          },
        },
        tooltip: {
          show: false,
        },
      });

      let nonNullIndex;
      elementData.vaccinated_first_new.some((vaccinedFirstNew, index) => {
        if (vaccinedFirstNew != null) {
          nonNullIndex = index;
          return true;
        }
      });
      /**신규 백신접종 추이 차트*/
      const newVaccination_spline = c3.generate({
        bindto: "#newVaccination_spline",
        padding: { left: 20, right: 20, top: 10, bottom: 10 },
        data: {
          json: {
            date: elementData.date.slice(nonNullIndex),
            "1차 접종": elementData.vaccinated_first_new.slice(nonNullIndex),
            "2차 접종": elementData.vaccinated_second_new.slice(nonNullIndex),
          },
          x: "date",
          type: "spline",
          colors: {
            "1차 접종": "#29C7CA",
            "2차 접종": "#2CABB1",
          },
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
            tick: {
              format: (d) => toLocalString(d) + " 명",
            },
          },
        },

        point: {
          show: false,
        },
      });

      /**누적 백신접종 추이 차트*/
      const totalVaccination_areaSpline = c3.generate({
        bindto: "#totalVaccination_areaSpline",
        padding: { left: 20, right: 20, top: 10, bottom: 10 },
        data: {
          json: {
            date: elementData.date.slice(nonNullIndex),
            "1차 접종": elementData.vaccinated_first_total.slice(nonNullIndex),
            "2차 접종": elementData.vaccinated_second_total.slice(nonNullIndex),
          },
          x: "date",
          type: "area-spline",
          colors: {
            "1차 접종": "#29C7CA",
            "2차 접종": "#2CABB1",
          },
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
            tick: {
              format: (d) => toLocalString(d) + " 명",
            },
          },
        },

        point: {
          show: false,
        },
      });
    }

    /**누적 확진 추이 차트*/
    c3.generate({
      bindto: "#totalConfirmedCase_areaSpline",
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
      data: {
        json: {
          date: elementData.date,
          확진: elementData.confirmed_total,
          격리해제: elementData.recovered_total,
        },
        x: "date",
        type: "area-spline",
        colors: {
          확진: "#353942",
          격리해제: "#29c7ca",
        },
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
          padding: 0,
          show: false,
          tick: {
            format: (d) => toLocalString(d) + " 명",
          },
        },
      },
      point: {
        show: false,
      },
    });

    /**신규 확진 추이*/
    const newConfirmedCase_areaSpline = c3.generate({
      bindto: "#newConfirmedCase_areaSpline",
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
      data: {
        json: {
          date: elementData.date,
          "국내 감염": elementData.quarantine_new_domestic,
          "해외 감염": elementData.quarantine_new_overseas,
          전체: elementData.quarantine_new_total,
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
          padding: 0,
          show: false,
          tick: {
            format: (d) => toLocalString(d) + " 명",
          },
        },
      },
      point: {
        show: false,
      },
    });
    const newConfirmedCaseVaccination_spline = c3.generate({
      bindto: "#newConfirmedCaseVaccination_spline",
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
      data: {
        json: {
          date: elementData.date,
          "2차 접종": elementData.vaccinated_second_total,
          "신규 확진": elementData.quarantine_new_total,
        },
        x: "date",
        type: "spline",
        axes: {
          "신규 확진": "y2",
        },
        colors: {
          "신규 확진": "#353942",
          "2차 접종": "#2CABB1",
        },
      },
      axis: {
        x: {
          show: true,
          type: "timeseries",
          tick: {
            format: "%y.%m.%d",
            fit: true,
            outer: false,
            centered: true,
            count: axisXcount,
          },
        },
        y: {
          padding: 0,
          show: false,
          tick: {
            outer: false,
            format: (d) => toLocalString(d) + " 명",
          },
        },
        y2: {
          padding: 0,
          show: false,
          tick: {
            outer: false,
            format: (d) => toLocalString(d) + " 명",
          },
        },
      },
      point: {
        show: false,
      },
    });
    const newDeath_spline = c3.generate({
      bindto: "#newDeath_spline",
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
      data: {
        json: {
          date: elementData.date,
          사망: elementData.dead_new,
        },
        x: "date",
        type: "spline",
        colors: {
          사망: "#353942",
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
            format: "%y.%m.%d",
            fit: true,
            outer: false,
            count: axisXcount,
          },
        },
        y: {
          padding: 0,
          show: false,
          tick: {
            format: (d) => toLocalString(d) + " 명",
          },
        },
      },
      point: {
        show: false,
      },
    });
    const totalDeath_areaSpline = c3.generate({
      bindto: "#totalDeath_areaSpline",
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
      data: {
        json: {
          date: elementData.date,
          사망: elementData.covid19Data.dead.total,
        },
        x: "date",
        type: "area-spline",
        colors: {
          사망: worse,
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
            format: "%y.%m.%d",
            fit: true,
            outer: false,
            count: axisXcount,
          },
        },
        y: {
          padding: 0,
          show: false,
          tick: {
            format: (d) => toLocalString(d) + " 명",
          },
        },
      },
      point: {
        show: false,
      },
    });
  }
  document.getElementById("loading").style.display = "none";
  chartLoading.style.display = "none";
}

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
function covid19_API(query) {
  return new Promise((resolve) => {
    const APIworker = new Worker("./src/js/worker.js");
    APIworker.postMessage(query);
    APIworker.onmessage = (messageEvent) => {
      APIworker.terminate();
      resolve(messageEvent.data.regionalDataList);
    };
  });
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
