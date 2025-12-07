export const settings = {
    mongoConfig: {
      serverUrl: "mongodb://127.0.0.1:27017/",
      database: "NYSeeNow"
    },
  
    nycApi: {
      baseUrl: "https://data.cityofnewyork.us/resource/tvpp-9vvx.json",
      limit: 50000
    },
  
    session: {
      secret: "superSecretNYSeeSessionKey",
      cookieName: "NYSEE_UserAuth"
    },
  
    server: {
      port: 3000
    }
  };
  