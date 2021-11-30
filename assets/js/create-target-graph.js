/**
 * 동적 데이터를 사용하는 element 업데이트
 * - change_data 함수를 이용해 업데이트
 */
async function create_dynamic_elements(region, startDate, endDate) {
  const query = `query{
      region(name:${region} startDate:${startDate} endDate:${endDate}){
        nameEng
        nameKor
        population
        covid19{
          date
          confirmed{
            total
            accumlated
            new{
              total
              domestic
              overseas
            }
          }
          quarantine
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
          ratePer100k
          immunityRatio
        }
      }
    }`;
  const regionalData = (await covid19_API(query))[0];
  const covid19Data = regionalData.covid19;
  const lastCovid19Data = covid19Data[covid19Data.length - 1];
  const chartData = {
    dateList: [],
    confirmed: {
      total: [],
      new: {
        total: [],
        domestic: [],
        overseas: [],
      },
    },
    recovered: {
      total: [],
    },
    quarantine: [],
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
      <div>${regionalData.nameKor} 상세정보</div>
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
            <td rowspan='2'>${toLocalString(lastCovid19Data.confirmed.new.total)} 명</td>
            <td>해외</td>
            <td>${toLocalString(lastCovid19Data.confirmed.new.overseas)} 명</td>
            <td rowspan='2'>${toLocalString(lastCovid19Data.recovered.new)} 명</td>
            <td rowspan='2'>${toLocalString(lastCovid19Data.dead.new)} 명</td>
          </tr>
          <tr>
            <td>국내</td>
            <td>${toLocalString(lastCovid19Data.confirmed.new.domestic)} 명</td>
          </tr>
          <tr>
            <td>누적</td>
            <td colspan='3'>(확진) ${toLocalString(lastCovid19Data.confirmed.accumlated)} 명</td>
            <td>${toLocalString(lastCovid19Data.recovered.accumlated)} 명</td>
            <td>${toLocalString(lastCovid19Data.dead.accumlated)} 명</td>
          </tr>
          <tr>
            <td>전체</td>
            <td colspan='3'>${toLocalString(lastCovid19Data.confirmed.total)} 명</td>
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
  covid19Data.forEach((covid19Data) => {
    chartData.dateList.push(covid19Data.date);
    chartData.quarantine.push(covid19Data.quarantine);
    chartData.confirmed.total.push(covid19Data.confirmed.total);
    chartData.recovered.total.push(covid19Data.recovered.total);
    chartData.dead.total.push(covid19Data.dead.total);
    chartData.dead.new.push(covid19Data.dead.new);
    chartData.confirmed.new.total.push(covid19Data.confirmed.new.total);
    chartData.confirmed.new.domestic.push(covid19Data.confirmed.new.domestic);
    chartData.confirmed.new.overseas.push(covid19Data.confirmed.new.overseas);
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
          ["격리", lastCovid19Data.quarantine],
          ["사망", lastCovid19Data.dead.total],
          ["회복", lastCovid19Data.recovered.total],
        ],
        type: "donut",
        colors: {
          사망: BLACK,
          회복: DEEP_GREEN,
          격리: DEEP_RED,
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
    if (regionalData.nameKor === "검역") {
      const lazarettoVaccinationTxt = "해당지역은 백신 접종 정보를<br>제공하지 않습니다.";
      vaccination2ndRate_gauge.innerHTML = "";
      newVaccination_spline.innerHTML = `<br><br><br>${lazarettoVaccinationTxt}`;
      totalVaccination_areaSpline.innerHTML = `<br><br><br>${lazarettoVaccinationTxt}`;
      newConfirmedVaccination_spline.innerHTML = `<br><br><br>${lazarettoVaccinationTxt}`;
      vaccination1st_txt.innerHTML = "검역";
      vaccination2nd_txt.innerHTML = lazarettoVaccinationTxt;
    } else {
      const vaccination1stTotalList = chartData.vaccinated._1st.total;
      const vaccination2ndTotalList = chartData.vaccinated._2nd.total;
      const lastVaccination1stTotal = vaccination1stTotalList[vaccination1stTotalList.length - 1];
      const lastVaccination2ndTotal = vaccination2ndTotalList[vaccination2ndTotalList.length - 1];
      const vaccinationMeaningfulIndex = vaccination2ndTotalList.findIndex((v) => v !== null);
      vaccination1st_txt.innerHTML = `1차 백신 접종: ${toLocalString(lastVaccination1stTotal)} 명`;
      vaccination2nd_txt.innerHTML = `2차 백신 접종: ${toLocalString(lastVaccination2ndTotal)} 명`;
      const chartOptions = {
        /**인규 대비 백신 접종률*/
        vaccination2ndRate_gauge: {
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
        },
        /**신규 백신접종 추이*/
        newVaccination_spline: {
          bindto: "#newVaccination_spline",
          padding: commonPadding,
          data: {
            json: {
              date: chartData.dateList.slice(vaccinationMeaningfulIndex),
              "1차 접종": chartData.vaccinated._1st.new.slice(vaccinationMeaningfulIndex),
              "2차 접종": chartData.vaccinated._2nd.new.slice(vaccinationMeaningfulIndex),
            },
            x: "date",
            type: chartTypeSwitcher("spline"),
            colors: {
              "1차 접종": GREEN,
              "2차 접종": DEEP_GREEN,
            },
          },
          axis: commonAxis,

          point: {
            show: false,
          },
        },
        /**누적 백신접종 추이*/
        totalVaccination_areaSpline: {
          bindto: "#totalVaccination_areaSpline",
          padding: commonPadding,
          data: {
            json: {
              date: chartData.dateList.slice(vaccinationMeaningfulIndex),
              "1차 접종": vaccination1stTotalList.slice(vaccinationMeaningfulIndex),
              "2차 접종": vaccination2ndTotalList.slice(vaccinationMeaningfulIndex),
            },
            x: "date",
            type: chartTypeSwitcher("area-spline"),
            colors: {
              "1차 접종": GREEN,
              "2차 접종": DEEP_GREEN,
            },
          },
          axis: commonAxis,
          point: {
            show: false,
          },
        },
        /**신규 확진, 2차 백신 접종 추이 비교*/
        newConfirmedVaccination_spline: {
          bindto: "#newConfirmedVaccination_spline",
          padding: commonPadding,
          data: {
            json: {
              date: chartData.dateList,
              "2차 접종": vaccination2ndTotalList,
              "신규 확진": chartData.confirmed.new.total,
            },
            x: "date",
            type: "spline",
            axes: {
              "신규 확진": "y2",
            },
            colors: {
              "신규 확진": DEEP_RED,
              "2차 접종": DEEP_GREEN,
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
        },
        /**격리중 환자 수 추이*/
        quarantine_spline: {
          bindto: "#quarantine_spline",
          padding: commonPadding,
          data: {
            json: {
              date: chartData.dateList,
              격리중: chartData.quarantine,
            },
            x: "date",
            type: chartTypeSwitcher("spline"),
            colors: {
              격리중: DEEP_RED,
            },
          },
          legend: {
            hide: true,
          },
          axis: commonAxis,
          point: {
            show: false,
          },
        },
      };
      for (option in chartOptions) {
        c3.generate(chartOptions[option]);
      }
    }

    /**신규 확진 추이*/
    const newConfirmed_areaSpline = c3.generate({
      bindto: "#newConfirmed_areaSpline",
      padding: commonPadding,
      data: {
        json: {
          date: chartData.dateList,
          "국내 감염": chartData.confirmed.new.domestic,
          "해외 감염": chartData.confirmed.new.overseas,
        },
        groups: [["국내 감염", "해외 감염"]],
        x: "date",
        type: chartTypeSwitcher("area-spline"),

        colors: {
          "국내 감염": RED,
          "해외 감염": DEEP_RED,
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
          확진: DEEP_RED,
          격리해제: GREEN,
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
          사망: BLACK,
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
          사망: BLACK,
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
  pageLoading.style.display = "none";
  chartsLoading.style.display = "none";
}
