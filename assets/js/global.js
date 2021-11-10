const today = new Date();

class StaticData {
  regionList = [];
  vaccination = {
    _1st: {
      new: [],
      total: [],
    },
    _2nd: {
      new: [],
      total: [],
    },
  };
  confirmed = {
    total: [],
    new: {
      domestic: [],
      overseas: [],
      total: [],
    },
  };
  ratePer100k = {
    new: [],
    newAverage7Days: [],
    total: [],
  };
  immunityRatio = [];
}

class DynamicData {
  dateList = [];
  confirmed = {
    total: [],
    new: {
      total: [],
      domestic: [],
      overseas: [],
    },
  };
  quarantine = [];
  recovered = {
    total: [],
  };
  dead = {
    new: [],
    total: [],
  };
  vaccination = {
    _1st: {
      new: [],
      total: [],
    },
    _2nd: {
      new: [],
      total: [],
    },
  };
}

/**Web worker에서 코로나 API 정보를 받아옴
 * @param {string} query 필요한 정보를 요청할 Query
 */
function get_covid19API(query) {
  return new Promise((resolve) => {
    const APIworker = new Worker("./assets/js/worker.js");
    APIworker.postMessage(query);
    APIworker.onmessage = (messageEvent) => {
      APIworker.terminate();
      resolve(messageEvent.data.region);
    };
  });
}

/**기준 날짜에서 원하는 일수를 뺀 날짜
 * @param {Date} date 기준 날짜
 * @param {number} num 뺄 일수
 * @returns {Date} 뺀 날짜
 */
function day_ago(date, num) {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() - num);
  return newDate;
}

/**
 * 문자형식 날짜를 숫자로 변환
 * @param {string} strDate '2021-02-01'
 * @returns {number} 20210201
 */
function strDate2num(strDate) {
  const add0 = (num) => (num < 10 ? "0" + num : String(num));
  const date = new Date(strDate),
    year = String(date.getFullYear()), //yyyy
    month = add0(1 + date.getMonth()), //M
    day = add0(date.getDate());
  return Number(year + month + day);
}
