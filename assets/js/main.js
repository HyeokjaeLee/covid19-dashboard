const today = new Date();
const chartLoading = document.getElementById("chartLoading");
const toLocalString = (number) => (number != null ? number.toLocaleString() : number);
/**dynamic element들의 기준이 되는 정보*/
const target = {
  region: "Total",
  startDate: 0,
  endDate: convert_date(today),
};

const DEEP_GREEN = "#2CABB1",
  GREEN = "#29C7CA",
  BLACK = "#353942",
  RED = "#FF8151",
  DEEP_RED = "#E7604A";

/**c3차트 생성 공통 데이터*/
const commonPadding = { left: 25, right: 25, top: 10, bottom: 10 },
  commonFormat = (d) => toLocalString(d) + " 명";

const main = (() => {
  create_static_elements();
  create_dynamic_elements(target.region, target.startDate, target.endDate);
})();

/*동적 차트 Data 변경*/
function change_data(_target) {
  chartsLoading.style.display = "flex";
  if (typeof _target === "string") target.region = _target;
  else target.startDate = !!_target ? convert_date(minus_date(today, _target)) : 0;
  create_dynamic_elements(target.region, target.startDate, target.endDate);
}

/**작은 화면에서 sidebar를 열고 닫기*/
function sidebar_control() {
  if (sidebar_section.style.display != "flex") {
    sidebar_section.style.display = "flex";
    sidebar_button.setAttribute("class", "hide");
  } else {
    sidebar_section.style.removeProperty("display");
    sidebar_button.classList.remove("hide");
  }
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
    const APIworker = new Worker("./assets/js/worker.js");
    APIworker.postMessage(query);
    APIworker.onmessage = (messageEvent) => {
      APIworker.terminate();
      resolve(messageEvent.data.region);
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
