const API_URL = "https://korea-covid19-api.herokuapp.com/";
onmessage = async (e) => {
  console.log("test");
  const data = await getGraphQL(API_URL, e.data);
  postMessage(data);
};

const getGraphQL = async (url, query) => {
  const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    }),
    json = await res.json(),
    data = json.data;
  return data;
};
