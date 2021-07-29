const today = new Date();
const chartLoading = document.getElementById("chartLoading");
const toLocalString = (number) => (number != null ? number.toLocaleString() : number);
/**dynamic element들의 기준이 되는 정보*/
const target = {
  region: "Total",
  startDate: 0,
  endDate: convert_date(today),
};

const deepGreen = "#2CABB1",
  green = "#29C7CA",
  black = "#353942",
  red = "#FF8151",
  deepRed = "#E7604A";

//c3차트 생성 공통 데이터
const commonPadding = { left: 25, right: 25, top: 10, bottom: 10 },
  commonFormat = (d) => toLocalString(d) + " 명";

const main = (() => {
  create_static_elements();
  create_dynamic_elements(target.region, target.startDate, target.endDate);
})();

/*동적 차트 Data 변경*/
function change_data(_target) {
  charts_loading.style.display = "flex";
  if (typeof _target === "string") target.region = _target;
  else target.startDate = !!_target ? convert_date(minus_date(today, _target)) : 0;
  create_dynamic_elements(target.region, target.startDate, target.endDate);
}

function open_list() {
  sidebar_section.style.display = "flex";
  open_button.style.display = "none";
  close_button.style.display = "block";
}

let mobileSidebarState = "hide";
function sidebar_control() {
  sidebar_button.setAttribute("class", mobileSidebarState);
  if (mobileSidebarState === "hide") {
    mobileSidebarState = "show";
    sidebar_section.style.display = "flex";
  } else {
    mobileSidebarState = "hide";
    sidebar_section.style.removeProperty("display");
  }
}

/**
 * 정적 데이터를 사용하는 element 업데이트
 * - 첫 페이지 로딩시에만 호출
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
    confirmed: {
      total: [],
    },
    quarantine: {
      new: {
        domestic: [],
        overseas: [],
        total: [],
      },
    },
    confirmedPer100k: {
      new: [],
      newAverage7Days: [],
      total: [],
    },
    immunityRatio: [],
  };
  const regionList_ul = document.getElementById("list");
  updateddDate.innerHTML = `Updated: ${
    regionalDataList[0].covid19DataList[regionalDataList[0].covid19DataList.length - 1].date
  }`;
  /**데이터를 분류하고 동시에 지역 List element를 생성하기 위한 루프*/
  regionalDataList.forEach((regionalData) => {
    const covid19DataList = regionalData.covid19DataList.slice(-7);
    const lastCovid19Data = covid19DataList[covid19DataList.length - 1];
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
                <li>${toLocalString(lastCovid19Data.quarantine.new.total)}</li>
                <li>${toLocalString(lastCovid19Data.confirmed.total)}</li>
                <li>${regionalData.distancingLevel + unitTxt}</li>
              </ul>`;
      regionList_ul.appendChild(regionList_li);
    }
    //차트 생성에 '검역' 데이터는 사용하지 않음
    if (regionalData.regionKor != "검역") {
      /**인구 10만명당 수 계산*/
      const count_per100k = (num) =>
        Math.round(num * (100000 / regionalData.population) * 100) / 100;
      let newConfirmedAverage7DaysPer100k = null;
      if (regionalData.regionKor != "전국") {
        let newConfirmed7DaySum = 0;
        covid19DataList.forEach((covid19Data) => {
          newConfirmed7DaySum += covid19Data.quarantine.new.total;
        });
        /**신규 확진 7일 평균*/
        const newConfirmed7DayAverage = newConfirmed7DaySum / covid19DataList.length;
        newConfirmedAverage7DaysPer100k = count_per100k(newConfirmed7DayAverage);
        /**예상 거리두기 단계*/
        const estimatedDistancingLv =
          newConfirmedAverage7DaysPer100k >= 4
            ? 4
            : newConfirmedAverage7DaysPer100k >= 2
            ? 3
            : newConfirmedAverage7DaysPer100k >= 1
            ? 2
            : 1;
        /**실제와 예상 거리두기 단계 차*/
        const differenceEstimatedDistancingLv =
          estimatedDistancingLv - regionalData.distancingLevel;
        const { arrow, unitTxt, estimated_list } =
          differenceEstimatedDistancingLv > 0
            ? { arrow: "↗", unitTxt: "+", estimated_list: estimatedIncreasing_list }
            : { arrow: "↘", unitTxt: "", estimated_list: estimatedDecreasing_list };
        const li = document.createElement("li"),
          span = document.createElement("span");
        li.append(
          `${regionalData.regionKor}: ${regionalData.distancingLevel} ${arrow} ${estimatedDistancingLv} 단계`
        );
        span.append(unitTxt + differenceEstimatedDistancingLv);
        li.append(span);
        estimated_list.append(li);
      }
      chartData.immunityRatio.push(lastCovid19Data.immunityRatio);
      chartData.regionList.push(regionalData.regionKor);
      chartData.confirmed.total.push(lastCovid19Data.confirmed.total);
      /**API의 신규 격리 데이터 shallow copy*/
      const newQuarantineData = lastCovid19Data.quarantine.new;
      chartData.quarantine.new.domestic.push(newQuarantineData.domestic);
      chartData.quarantine.new.overseas.push(newQuarantineData.overseas);
      chartData.quarantine.new.total.push(newQuarantineData.total);
      /**API의 백신접종 데이터 shallow copy*/
      const vaccinationData = lastCovid19Data.vaccinated;
      chartData.vaccination._1st.new.push(vaccinationData.first.new);
      chartData.vaccination._1st.total.push(vaccinationData.first.total);
      chartData.vaccination._2nd.new.push(vaccinationData.second.new);
      chartData.vaccination._2nd.total.push(vaccinationData.second.total);
      chartData.confirmedPer100k.newAverage7Days.push(newConfirmedAverage7DaysPer100k);
      chartData.confirmedPer100k.new.push(count_per100k(newQuarantineData.total));
      chartData.confirmedPer100k.total.push(lastCovid19Data.per100kConfirmed);
    }
  });
  {
    const li = document.createElement("li");
    li.innerHTML = "예상되는 지역이 없습니다.";
    li.setAttribute("style", "text-align:center");
    if (estimatedDecreasing_list.childElementCount === 0) estimatedDecreasing_list.append(li);
    if (estimatedIncreasing_list.childElementCount === 0) estimatedIncreasing_list.append(li);
  }

  //차트 생성
  {
    const commonAxis = {
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
    /**지역 구분 '전국'을 제외한 지역 리스트*/
    const actualRegionList = chartData.regionList.slice(1);
    /**7일 평균 인구 10만명당 신규 확진자*/
    const newConfirmedAverage7Days_bar = c3.generate({
      bindto: "#newConfirmedAverage7Days_bar",
      padding: commonPadding,
      data: {
        json: {
          region: actualRegionList,
          확진: chartData.confirmedPer100k.newAverage7Days.slice(1),
        },
        x: "region",
        type: "bar",
        colors: { 확진: green },
        color: (color, d) => (d.value >= 4 ? deepRed : d.value >= 1 ? red : color),
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
            },
            {
              value: 2,
              text: "거리두기 3단계",
            },
            {
              value: 4,
              text: "거리두기 4단계",
            },
          ],
        },
      },
    });

    /**인구 10만명당 신규 확진자*/
    const newConfirmedPer100k_bar = c3.generate({
      bindto: "#newConfirmedPer100k_bar",
      padding: commonPadding,
      data: {
        json: {
          region: actualRegionList,
          확진: chartData.confirmedPer100k.new.slice(1),
        },
        x: "region",
        type: "bar",
        colors: { 확진: red },
        color: (color, d) => (d.value >= chartData.confirmedPer100k.new[0] ? deepRed : color),
      },
      legend: {
        hide: true,
      },
      axis: commonAxis,
      grid: {
        y: {
          lines: [
            {
              value: chartData.confirmedPer100k.new[0],
              text: `전국 ${chartData.confirmedPer100k.new[0]}명`,
            },
          ],
        },
      },
    });

    /**인구 10만명당 누적 확진자*/
    const totalConfirmedPer100k_bar = c3.generate({
      bindto: "#totalConfirmedPer100k_bar",
      padding: commonPadding,
      data: {
        json: {
          region: actualRegionList,
          확진: chartData.confirmedPer100k.total.slice(1),
        },
        x: "region",
        type: "bar",
        colors: { 확진: red },
        color: (color, d) => (d.value >= chartData.confirmedPer100k.total[0] ? deepRed : color),
      },
      legend: {
        hide: true,
      },
      axis: commonAxis,
      grid: {
        y: {
          lines: [
            {
              value: chartData.confirmedPer100k.total[0],
              text: `전국 ${chartData.confirmedPer100k.total[0]}명`,
            },
          ],
        },
      },
    });

    /**신규 확진자*/
    const newConfirmed_bar = c3.generate({
      bindto: "#newConfirmed_bar",
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
        colors: { 해외: deepRed, 국내: red },
      },
      axis: commonAxis,
    });
    /**누적 확진자*/
    const totalConfirmed_bar = c3.generate({
      bindto: "#totalConfirmed_bar",
      padding: commonPadding,
      data: {
        json: {
          region: actualRegionList,
          확진: chartData.confirmed.total.slice(1),
        },
        x: "region",
        type: "bar",
        colors: { 확진: deepRed },
      },
      legend: {
        hide: true,
      },
      axis: commonAxis,
    });

    /**신규 백신 접종자*/
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
        colors: { "1차 접종": green, "2차 접종": deepGreen },
      },
      axis: commonAxis,
    });

    /**누적 백신 접종자*/
    const totalVaccination_bar = c3.generate({
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
        colors: { "1차 접종": green, "2차 접종": deepGreen },
      },
      axis: commonAxis,
    });

    /**면역자 비율*/
    const immunityRatio_bar = c3.generate({
      bindto: "#immunityRatio_bar",
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
      data: {
        json: {
          region: chartData.regionList,
          "면역 비율": chartData.immunityRatio,
        },
        x: "region",
        type: "bar",
        colors: { "면역 비율": deepGreen },
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
}

/**
 * 동적 데이터를 사용하는 element 업데이트
 * - change_data 함수를 이용해 업데이트
 */
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
  const regionalData = (await covid19_API(query))[0];
  const covid19DataList = regionalData.covid19DataList;
  const lastCovid19Data = covid19DataList[covid19DataList.length - 1];
  const chartData = {
    dateList: [],
    confirmed: {
      total: [],
    },
    quarantine: {
      new: {
        total: [],
        domestic: [],
        overseas: [],
      },
      total: [], //현재 격리중인 환자 그래프 생성 todo
    },
    recovered: {
      total: [],
    },
    dead: {
      new: [],
      total: [],
    },
    vaccinated: {
      _1st: {
        new: [],
        total: [],
      },
      _2nd: {
        new: [],
        total: [],
      },
    },
  };

  /**상세 정보 태이블 생성*/
  {
    regionInfo_table.innerHTML = `
    <div>${regionalData.regionKor} 상세정보</div>
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
          <td rowspan='2'>${toLocalString(lastCovid19Data.quarantine.new.total)} 명</td>
          <td>해외</td>
          <td>${toLocalString(lastCovid19Data.quarantine.new.overseas)} 명</td>
          <td rowspan='2'>${toLocalString(lastCovid19Data.recovered.new)} 명</td>
          <td rowspan='2'>${toLocalString(lastCovid19Data.dead.new)} 명</td>
        </tr>
        <tr>
          <td>국내</td>
          <td>${toLocalString(lastCovid19Data.quarantine.new.domestic)} 명</td>
        </tr>
        <tr>
          <td>누적</td>
          <td colspan='3'>(확진) ${toLocalString(lastCovid19Data.confirmed.accumlated)} 명</td>
          <td>${toLocalString(lastCovid19Data.recovered.accumlated)} 명</td>
          <td>${toLocalString(lastCovid19Data.dead.accumlated)} 명</td>
        </tr>
        <tr>
          <td>전체</td>
          <td colspan='3'>${toLocalString(lastCovid19Data.quarantine.total)} 명</td>
          <td>${toLocalString(lastCovid19Data.recovered.total)} 명</td>
          <td>${toLocalString(lastCovid19Data.dead.total)} 명</td>
        </tr>
        <tr>
          <td>총 확진자</td>
          <td colspan='5'>${toLocalString(lastCovid19Data.confirmed.total)} 명</td>
        </tr>
      </tbody>
    </table>
    `;
  }
  covid19DataList.forEach((covid19Data) => {
    chartData.dateList.push(covid19Data.date);
    chartData.confirmed.total.push(covid19Data.confirmed.total);
    chartData.recovered.total.push(covid19Data.recovered.total);
    chartData.dead.total.push(covid19Data.dead.total);
    chartData.dead.new.push(covid19Data.dead.new);
    const quarantineData = covid19Data.quarantine;
    chartData.quarantine.total.push(quarantineData.total);
    chartData.quarantine.new.total.push(quarantineData.new.total);
    chartData.quarantine.new.domestic.push(quarantineData.new.domestic);
    chartData.quarantine.new.overseas.push(quarantineData.new.overseas);
    const vaccinationData = covid19Data.vaccinated;
    chartData.vaccinated._1st.total.push(vaccinationData.first.total);
    chartData.vaccinated._1st.new.push(vaccinationData.first.new);
    chartData.vaccinated._2nd.total.push(vaccinationData.second.total);
    chartData.vaccinated._2nd.new.push(vaccinationData.second.new);
  });
  /**차트 생성*/
  {
    const chartTypeSwitcher = (type) => (chartData.dateList.length < 30 ? "bar" : type);
    const axisXcount = chartData.dateList.length < 10 ? chartData.dateList.length : 2;
    const commonAxis = {
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
          outer: false,
          format: commonFormat,
        },
      },
    };
    /**확진자 상태 비율*/
    const confirmedRatio_donut = c3.generate({
      bindto: "#confirmedRatio_donut",
      data: {
        columns: [
          ["격리", lastCovid19Data.quarantine.total],
          ["사망", lastCovid19Data.dead.total],
          ["회복", lastCovid19Data.recovered.total],
        ],
        type: "donut",
        colors: {
          사망: black,
          회복: deepGreen,
          격리: deepRed,
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

    /**백신 접종 관련 차트 생성
     * 지역 구분 '검역'은 백신 접종 관련 정보를 제공하지 않음
     */
    if (regionalData.regionKor === "검역") {
      const lazarettoVaccinationTxt = "해당지역은 백신 접종 정보를<br>제공하지 않습니다.";
      vaccination2ndRate_gauge.innerHTML = "";
      newVaccination_spline.innerHTML = `<br><br><br>${lazarettoVaccinationTxt}`;
      totalVaccination_areaSpline.innerHTML = `<br><br><br>${lazarettoVaccinationTxt}`;
      newConfirmedVaccination_spline.innerHTML = `<br><br><br>${lazarettoVaccinationTxt}`;
      vaccination1st_txt.innerHTML = "검역";
      vaccination2nd_txt.innerHTML = lazarettoVaccinationTxt;
    } else {
      const vaccination1stTotalList = chartData.vaccinated._1st.total,
        vaccination2ndTotalList = chartData.vaccinated._2nd.total;
      const lastVaccination1stTotal = vaccination1stTotalList[vaccination1stTotalList.length - 1],
        lastVaccination2ndTotal = vaccination2ndTotalList[vaccination2ndTotalList.length - 1];

      vaccination1st_txt.innerHTML = `1차 백신 접종: ${toLocalString(lastVaccination1stTotal)} 명`;
      vaccination2nd_txt.innerHTML = `2차 백신 접종: ${toLocalString(lastVaccination2ndTotal)} 명`;

      /**인규 대비 백신 접종률*/
      const vaccination2ndRate_gauge = c3.generate({
        bindto: "#vaccination2ndRate_gauge",
        data: {
          columns: [["2차 백신 접종", lastVaccination2ndTotal]],
          type: "gauge",
        },
        gauge: {
          max: regionalData.population,
          expand: false,
          label: {
            show: false,
          },
        },
        tooltip: {
          show: false,
        },
      });

      /**백신 정보 실제 시작 index*/
      const nonNullIndex = (() => {
        for (let i = 0; i < vaccination2ndTotalList.length; i++) {
          if (vaccination2ndTotalList[i] !== null) {
            return i;
          }
        }
      })();

      /**신규 백신접종 추이*/
      const newVaccination_spline = c3.generate({
        bindto: "#newVaccination_spline",
        padding: commonPadding,
        data: {
          json: {
            date: chartData.dateList.slice(nonNullIndex),
            "1차 접종": chartData.vaccinated._1st.new.slice(nonNullIndex),
            "2차 접종": chartData.vaccinated._2nd.new.slice(nonNullIndex),
          },
          x: "date",
          type: chartTypeSwitcher("spline"),
          colors: {
            "1차 접종": green,
            "2차 접종": deepGreen,
          },
        },
        axis: commonAxis,

        point: {
          show: false,
        },
      });

      /**누적 백신접종 추이*/
      const totalVaccination_areaSpline = c3.generate({
        bindto: "#totalVaccination_areaSpline",
        padding: commonPadding,
        data: {
          json: {
            date: chartData.dateList.slice(nonNullIndex),
            "1차 접종": vaccination1stTotalList.slice(nonNullIndex),
            "2차 접종": vaccination2ndTotalList.slice(nonNullIndex),
          },
          x: "date",
          type: chartTypeSwitcher("area-spline"),
          colors: {
            "1차 접종": green,
            "2차 접종": deepGreen,
          },
        },
        axis: commonAxis,
        point: {
          show: false,
        },
      });

      /**격리중 환자 수 추이*/
      const quarantine_spline = c3.generate({
        bindto: "#quarantine_spline",
        padding: commonPadding,
        data: {
          json: {
            date: chartData.dateList,
            격리중: chartData.quarantine.total,
          },
          x: "date",
          type: chartTypeSwitcher("spline"),
          colors: {
            격리중: deepRed,
          },
        },
        legend: {
          hide: true,
        },
        axis: commonAxis,
        point: {
          show: false,
        },
      });

      /**신규 확진, 2차 백신 접종 추이 비교*/
      const newConfirmedVaccination_spline = c3.generate({
        bindto: "#newConfirmedVaccination_spline",
        padding: commonPadding,
        data: {
          json: {
            date: chartData.dateList,
            "2차 접종": vaccination2ndTotalList,
            "신규 확진": chartData.quarantine.new.total,
          },
          x: "date",
          type: "spline",
          axes: {
            "신규 확진": "y2",
          },
          colors: {
            "신규 확진": deepRed,
            "2차 접종": deepGreen,
          },
        },
        axis: {
          x: commonAxis.x,
          y: commonAxis.y,
          y2: commonAxis.y,
        },
        point: {
          show: false,
        },
      });
    }

    /**신규 확진 추이*/
    const newConfirmed_areaSpline = c3.generate({
      bindto: "#newConfirmed_areaSpline",
      padding: commonPadding,
      data: {
        json: {
          date: chartData.dateList,
          "국내 감염": chartData.quarantine.new.domestic,
          "해외 감염": chartData.quarantine.new.overseas,
        },
        groups: [["국내 감염", "해외 감염"]],
        x: "date",
        type: chartTypeSwitcher("area-spline"),

        colors: {
          "국내 감염": red,
          "해외 감염": deepRed,
        },
      },
      legend: {
        hide: true,
      },
      axis: commonAxis,
      point: {
        show: false,
      },
    });

    /**누적 확진 추이*/
    const totalConfirmed_areaSpline = c3.generate({
      bindto: "#totalConfirmed_areaSpline",
      padding: commonPadding,
      data: {
        json: {
          date: chartData.dateList,
          확진: chartData.confirmed.total,
          격리해제: chartData.recovered.total,
        },
        x: "date",
        type: chartTypeSwitcher("area-spline"),
        colors: {
          확진: deepRed,
          격리해제: green,
        },
      },
      axis: commonAxis,
      point: {
        show: false,
      },
    });

    /**신규 사망 추이*/
    const newDeath_spline = c3.generate({
      bindto: "#newDeath_spline",
      padding: commonPadding,
      data: {
        json: {
          date: chartData.dateList,
          사망: chartData.dead.new,
        },
        x: "date",
        type: chartTypeSwitcher("spline"),
        colors: {
          사망: black,
        },
      },
      legend: {
        hide: true,
      },
      axis: commonAxis,
      point: {
        show: false,
      },
    });

    /**누적 사망 추이*/
    const totalDeath_areaSpline = c3.generate({
      bindto: "#totalDeath_areaSpline",
      padding: commonPadding,
      data: {
        json: {
          date: chartData.dateList,
          사망: chartData.dead.total,
        },
        x: "date",
        type: chartTypeSwitcher("area-spline"),
        colors: {
          사망: black,
        },
      },
      legend: {
        hide: true,
      },
      axis: commonAxis,
      point: {
        show: false,
      },
    });
  }
  document.getElementById("loading").style.display = "none";
  charts_loading.style.display = "none";
}

/**날짜 형식 숫자로 변경
 * @param date 날짜 "2021-05-01"
 * @returns 20210501
 */
function convert_date(date) {
  date = new Date(date);
  const num2ndr = (num) => (num < 10 ? "0" + num : String(num)),
    year = String(date.getFullYear()), //yyyy
    month = num2ndr(1 + date.getMonth()), //M
    day = num2ndr(date.getDate());
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
  date.setDate(date.getDate() - num + 1);
  return date;
}
