const create_query = (region, startDate, endDate) => `query{
  covid19Info(region:${region} startDate:${startDate} endDate:${endDate}){
    regionEng
    regionKor
    population
    covid19{
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

const get_API_data = () => {
  return new Promise((resolve, reject) => {
    const APIworker = new Worker("/src/js/worker.js");
    APIworker.postMessage(create_query("Seoul", 20210101, 20210201));
    APIworker.onmessage = (e) => {
      resolve(e.data);
    };
  });
};

const test = async () => {
  console.log(await get_API_data());
};

test();
