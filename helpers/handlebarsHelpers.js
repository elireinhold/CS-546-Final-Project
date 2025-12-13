export default {
    ifEquals(a, b, options) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    },
  
    contains(arr, value) {
      if (!arr) return false;
      if (Array.isArray(arr)) {
        return arr.indexOf(value) !== -1;
      }
      return arr === value;
    },
  
    toString(value) {
      if (value === undefined || value === null) return "";
      return value + "";
    },
  
    eq(a, b) {
      return String(a) === String(b);
    },
  
    json(data) {
      return JSON.stringify(data);
    },
  
    add(a, b) {
      return Number(a) + Number(b);
    },
  
    subtract(a, b) {
      return Number(a) - Number(b);
    },
  
    gt(a, b) {
      return a > b;
    },
  
    lt(a, b) {
      return a < b;
    },
  
    toArray(value) {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      return [value];
    },
  
    queryString(options) {
      const parts = [];

      for (const key in options.hash) {
        const val = options.hash[key];

        if (!val) continue;

        if (Array.isArray(val)) {
          for (let i = 0; i < val.length; i++) {
            parts.push(key + "=" + val[i]);
          }
        } else {
          parts.push(key + "=" + val);
        }
      }
      return parts.join("&");
    },

    formatDateTime(dateTimeString) {
      if (!dateTimeString) return "";
      try {
        const date = new Date(dateTimeString.replace(" ", "T"));
        if (isNaN(date.getTime())) {
          return dateTimeString;
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
        const hoursStr = String(hours).padStart(2, "0");
        return `${month}/${day}/${year}, ${hoursStr}:${minutes}:${seconds} ${ampm}`;
      } catch (e) {
        return dateTimeString;
      }
    }
  };