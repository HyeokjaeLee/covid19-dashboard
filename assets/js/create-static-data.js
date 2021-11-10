async function get_static_chartData() {
  const startDate = convert_date(minus_date(today, 8));
  const endDate = convert_date(today);
  const query = `query{
      region(startDate:${startDate} endDate:${endDate}){
        nameEng
        nameKor
        population
        distancingLevel
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
  const regionArr = await get_covid19API(query);
  regionArr.forEach((region) => {
    const covid19Data = region.covid19.slice(-7);
    const lastCovid19Data = covid19Data[covid19Data.length - 1];
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
                <li>${regionalData.nameKor}</li>
                <li>${toLocalString(lastCovid19Data.confirmed.new.total)}</li>
                <li>${toLocalString(lastCovid19Data.confirmed.total)}</li>
                <li>${regionalData.distancingLevel + unitTxt}</li>
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
        const { arrow, unitTxt } =
          differenceEstimatedDistancingLv > 0
            ? { arrow: "↗", unitTxt: "+" }
            : { arrow: "↘", unitTxt: "" };
        const li = document.createElement("li"),
          span = document.createElement("span");
        li.append(
          `${regionalData.nameKor}: ${regionalData.distancingLevel} ${arrow} ${estimatedDistancingLv} 단계`
        );
        span.append(unitTxt + differenceEstimatedDistancingLv);
        li.append(span);
        if (differenceEstimatedDistancingLv > 0) {
          estimatedIncreasing_list.appendChild(li);
        } else if (differenceEstimatedDistancingLv < 0) {
          estimatedDecreasing_list.appendChild(li);
        }
      }
      chartData.immunityRatio.push(lastCovid19Data.immunityRatio);
      chartData.regionList.push(regionalData.nameKor);
      chartData.confirmed.total.push(lastCovid19Data.confirmed.total);
      /**API의 신규 격리 데이터 shallow copy*/
      const newConfirmedData = lastCovid19Data.confirmed.new;
      chartData.confirmed.new.domestic.push(newConfirmedData.domestic);
      chartData.confirmed.new.overseas.push(newConfirmedData.overseas);
      chartData.confirmed.new.total.push(newConfirmedData.total);
      /**API의 백신접종 데이터 shallow copy*/
      const vaccinationData = lastCovid19Data.vaccinated;
      chartData.vaccination._1st.new.push(vaccinationData.first.new);
      chartData.vaccination._1st.total.push(vaccinationData.first.total);
      chartData.vaccination._2nd.new.push(vaccinationData.second.new);
      chartData.vaccination._2nd.total.push(vaccinationData.second.total);
      chartData.ratePer100k.newAverage7Days.push(newConfirmedAverage7DaysPer100k);
      chartData.ratePer100k.new.push(count_per100k(newConfirmedData.total));
      chartData.ratePer100k.total.push(lastCovid19Data.ratePer100k);
    }
  });
}
