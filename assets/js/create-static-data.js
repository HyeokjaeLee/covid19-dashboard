async function get_staticData() {
  const query = `query{
      region(onlyLastDate:true){
        nameKor
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
  return await get_covid19API(query);
}

function push_covid19Data(staticData, covid19) {
  staticData.confirmed.total.push(covid19.confirmed.total);
  staticData.confirmed.new.domestic.push(covid19.confirmed.new.domestic);
  staticData.confirmed.new.overseas.push(covid19.confirmed.new.overseas);
  staticData.confirmed.new.total.push(covid19.confirmed.new.total);
  staticData.vaccination._1st.new.push(covid19.vaccinated.first.new);
  staticData.vaccination._1st.total.push(covid19.vaccinated.first.total);
  staticData.vaccination._2nd.new.push(covid19.vaccinated.second.new);
  staticData.vaccination._2nd.total.push(covid19.vaccinated.second.total);
  staticData.ratePer100k.push(covid19.ratePer100k);
  staticData.immunityRatio.push(covid19.immunityRatio);
}
