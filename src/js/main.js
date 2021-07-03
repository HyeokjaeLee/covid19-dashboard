const create_query = (region, startDate, endDate) => `query{
  covid19Info(region:"${region}"){
    regionEng
    covid19{
      date
    }
  }
}`;

const query = `query{
  covid19Info(region:"Seoul"){
    regionEng
    covid19{
      date
    }
  }
}`;

const test = async () => {
  const APIworker = new Worker("/src/js/worker.js");
  APIworker.postMessage(create_query("Seoul"));
  APIworker.onmessage = (e) => {
    console.log(e.data);
    APIworker.terminate();
  };
};

test();
