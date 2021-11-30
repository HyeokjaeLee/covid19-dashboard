/**
 * 정적 데이터를 사용하는 element 업데이트
 * - 첫 페이지 로딩시에만 호출
 */
async function create_static_elements() {
  const startDate = convert_date(minus_date(today, 8));
  const endDate = convert_date(today);
  const query = `query{
      region(startDate:${startDate} endDate:${endDate}){
        nameEng
        nameKor
        population
        covid19{
          date
          confirmed{
            total
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
          ratePer100k
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
      new: {
        domestic: [],
        overseas: [],
        total: [],
      },
    },
    ratePer100k: {
      new: [],
      newAverage7Days: [],
      total: [],
    },
    immunityRatio: [],
  };
  const regionList_ul = document.getElementById("list");
  updateddDate.innerHTML = `Updated: ${
    regionalDataList[0].covid19[regionalDataList[0].covid19.length - 1].date
  }`;
  /**데이터를 분류하고 동시에 지역 List element를 생성하기 위한 루프*/
  regionalDataList.forEach((regionalData) => {
    const covid19Data = regionalData.covid19.slice(-7);
    const lastCovid19Data = covid19Data[covid19Data.length - 1];
    //지역 리스트 item 생성 및 추가
    {
      const regionList_li = document.createElement("li");
      regionList_li.setAttribute("id", regionalData.nameEng);
      regionList_li.setAttribute(
        "onClick",
        `change_data("${regionalData.nameEng}"); location.href='#regionChartsLine'`
      );
      regionList_li.innerHTML = `
                <ul class="list_item">
                  <li>${regionalData.nameKor}</li>
                  <li>${toLocalString(lastCovid19Data.confirmed.new.total)}</li>
                  <li>${toLocalString(lastCovid19Data.confirmed.total)}</li>
                </ul>`;
      regionList_ul.appendChild(regionList_li);
    }
    //차트 생성에 '검역' 데이터는 사용하지 않음
    if (regionalData.nameKor != "검역") {
      /**인구 10만명당 수 계산*/
      const count_per100k = (num) =>
        Math.round(num * (100000 / regionalData.population) * 100) / 100;
      let newConfirmedAverage7DaysPer100k = null;
      if (regionalData.nameKor != "전국") {
        let newConfirmed7DaySum = 0;
        covid19Data.forEach((covid19Data) => {
          newConfirmed7DaySum += covid19Data.confirmed.new.total;
        });
        /**신규 확진 7일 평균*/
        const newConfirmed7DayAverage = newConfirmed7DaySum / covid19Data.length;
        newConfirmedAverage7DaysPer100k = count_per100k(newConfirmed7DayAverage);
      }
      chartData.immunityRatio.push(lastCovid19Data.immunityRatio);
      chartData.regionList.push(regionalData.nameKor);
      chartData.confirmed.total.push(lastCovid19Data.confirmed.total);
      /**API의 신규 격리 데이터 shallow copy*/
      chartData.confirmed.new.domestic.push(lastCovid19Data.confirmed.new.domestic);
      chartData.confirmed.new.overseas.push(lastCovid19Data.confirmed.new.overseas);
      chartData.confirmed.new.total.push(lastCovid19Data.confirmed.new.total);
      /**API의 백신접종 데이터 shallow copy*/
      chartData.vaccination._1st.new.push(lastCovid19Data.vaccinated.first.new);
      chartData.vaccination._1st.total.push(lastCovid19Data.vaccinated.first.total);
      chartData.vaccination._2nd.new.push(lastCovid19Data.vaccinated.second.new);
      chartData.vaccination._2nd.total.push(lastCovid19Data.vaccinated.second.total);
      chartData.ratePer100k.newAverage7Days.push(newConfirmedAverage7DaysPer100k);
      chartData.ratePer100k.new.push(count_per100k(lastCovid19Data.confirmed.total));
      chartData.ratePer100k.total.push(lastCovid19Data.ratePer100k);
    }
  });

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
          확진: chartData.ratePer100k.newAverage7Days.slice(1),
        },
        x: "region",
        type: "bar",
        colors: { 확진: GREEN },
        color: (color, d) => (d.value >= 4 ? DEEP_RED : d.value >= 1 ? RED : color),
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
          확진: chartData.ratePer100k.new.slice(1),
        },
        x: "region",
        type: "bar",
        colors: { 확진: RED },
        color: (color, d) => (d.value >= chartData.ratePer100k.new[0] ? DEEP_RED : color),
      },
      legend: {
        hide: true,
      },
      axis: commonAxis,
      grid: {
        y: {
          lines: [
            {
              value: chartData.ratePer100k.new[0],
              text: `전국 ${chartData.ratePer100k.new[0]}명`,
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
          확진: chartData.ratePer100k.total.slice(1),
        },
        x: "region",
        type: "bar",
        colors: { 확진: RED },
        color: (color, d) => (d.value >= chartData.ratePer100k.total[0] ? DEEP_RED : color),
      },
      legend: {
        hide: true,
      },
      axis: commonAxis,
      grid: {
        y: {
          lines: [
            {
              value: chartData.ratePer100k.total[0],
              text: `전국 ${chartData.ratePer100k.total[0]}명`,
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
          해외: chartData.confirmed.new.overseas.slice(1),
          국내: chartData.confirmed.new.domestic.slice(1),
        },
        x: "region",
        type: "bar",
        groups: [["해외", "국내"]],
        colors: { 해외: DEEP_RED, 국내: RED },
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
        colors: { 확진: DEEP_RED },
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
        colors: { "1차 접종": GREEN, "2차 접종": DEEP_GREEN },
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
        colors: { "1차 접종": GREEN, "2차 접종": DEEP_GREEN },
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
        colors: { "면역 비율": DEEP_GREEN },
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
