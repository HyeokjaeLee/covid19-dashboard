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
      vaccination{
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
      vaccination{
        first{
          total
        }
        second{
          total
        }
      }
      per100kConfirmed
    }
  }
}`;
  covid19_API(query, (regionalDataList) => {
    const regionList_ul = document.getElementById("list");
    const regionList = [];
    const Per100kConfirmedList = [];
    const newQuarantineList = {
      domestic: [],
      overseas: [],
    };
    const vaccinationList = {
      first: [],
      second: [],
    };
    regionalDataList.forEach((regionalData) => {
      Per100kConfirmedList.push(
        regionalData.covid19DataList[0].per100kConfirmed
      );
      newQuarantineList.domestic.push(
        regionalData.covid19DataList[0].quarantine.new.domestic
      );
      newQuarantineList.overseas.push(
        regionalData.covid19DataList[0].quarantine.new.overseas
      );
      vaccinationList.first.push(
        regionalData.covid19DataList[0].vaccination.first.total
      );
      vaccinationList.second.push(
        regionalData.covid19DataList[0].vaccination.second.total
      );
      regionList.push(regionalData.regionKor);
      const regionList_li = document.createElement("li");
      regionList_li.setAttribute("id", regionalData.regionEng);
      regionList_li.innerHTML = `
      <ul class="list_item">
        <li>${regionalData.regionKor}</li>
        <li>${regionalData.covid19DataList[0].quarantine.new.total.toLocaleString()}</li>
        <li>${regionalData.covid19DataList[0].quarantine.total.toLocaleString()}</li>
        <li>${regionalData.covid19DataList[0].confirmed.total.toLocaleString()}</li>
      </ul>`;
      regionList_ul.appendChild(regionList_li);
    });
    //10만명 당 확진 차트
    c3.generate({
      bindto: "#per100k_chart",
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
      data: {
        json: {
          region: regionList.slice(1, 18),
          "10만명 당 확진자": Per100kConfirmedList.slice(1, 18),
        },
        x: "region",
        type: "bar",
        colors: { "10만명 당 확진자": "#e7604a" },
      },
      axis: {
        x: {
          show: true,
          type: "category",
        },
        y: {
          show: false,
        },
      },
      grid: {
        y: {
          lines: [
            {
              value: Per100kConfirmedList[0],
              text: `전국 평균 ${Per100kConfirmedList[0]}명`,
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
      },
      axis: {
        x: {
          show: true,
          type: "category",
        },
        y: {
          show: false,
        },
      },
      point: {
        show: false,
      },
    });
    console.log(newQuarantineList.domestic);
    //백신 접종 차트
    c3.generate({
      bindto: "#vaccination_chart",
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
      data: {
        json: {
          region: regionList.slice(1, 18),
          "1차 접종": vaccinationList.first.slice(1, 18),
          "2차 접종": vaccinationList.second.slice(1, 18),
        },
        x: "region",
        type: "bar",
      },
      axis: {
        x: {
          show: true,
          type: "category",
        },
        y: {
          show: false,
        },
      },
      point: {
        show: false,
      },
    });
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
      vaccination{
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
  covid19_API(query, (regionalDataList) => {
    const covid19DataList = regionalDataList[0].covid19DataList;
    const lastData = covid19DataList[covid19DataList.length - 1];
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
  });
};
create_list();
create_chart("Total", 20210101, 20210201);
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
