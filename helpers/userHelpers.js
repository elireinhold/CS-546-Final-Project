import { users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";

async function getUsers() {
  const usersCollection = await users();
  const usersList = await usersCollection.find({}).toArray();
  return usersList;
}

const exportedMethods = {
  validFirstOrLastName(name) {
    if (typeof name !== "string") {
      throw "Error: Name must be a string.";
    }
    name = name.trim();
    if (name.length === 0) {
      throw "Error: Name cannot be an empty string or just spaces.";
    }
    const nameRegex = /^[A-Za-z]+$/;
    if (!nameRegex.test(name)) {
      throw "Error: Name must contain only alphabet characters.";
    }
    if (name.length < 2 || name.length > 20) {
      throw "Error: Name must be between 2 and 20 characters long.";
    }
    return name;
  },
  async validUserNameRegister(userName) {
    if (!userName) {
      throw "Error: Must provide userName.";
    }
    if (typeof userName !== "string") {
      throw "Error: Username must be a string.";
    }
    userName = userName.trim();
    if (userName.length === 0) {
      throw "Error: Username cannot be an empty string or just spaces.";
    }
    if (userName.length < 5 || userName.length > 10) {
      throw "Error: Username must be between 5 and 10 characters long.";
    }

    const lowerUserName = userName.toLowerCase();
    const userNameRegex = /^[A-Za-z0-9]+$/;
    if (!userNameRegex.test(lowerUserName)) {
      throw "Error: Username must contain only alphanumeric characters.";
    }

    const usersList = await getUsers();
    for (let i = 0; i < usersList.length; i++) {
      if (usersList[i].lowerUserName.toLowerCase() === lowerUserName) {
        throw "Error: Username already exists. Please choose a different Username.";
      }
    }
    return userName;
  },
  async validUserNameLogin(userName) {
    if (!userName) {
      throw "Error: Must provide userName.";
    }
    if (typeof userName !== "string") {
      throw "Error: Username must be a string.";
    }
    userName = userName.trim();
    if (userName.length === 0) {
      throw "Error: Username cannot be an empty string or just spaces.";
    }
    if (userName.length < 5 || userName.length > 10) {
      throw "Error: Username must be between 5 and 10 characters long.";
    }
    const userNameRegex = /^[A-Za-z0-9]+$/;
    if (!userNameRegex.test(userName)) {
      throw "Error: Username must contain only alphanumeric characters.";
    }
    return userName;
  },
  validPassword(password) {
    if (!password) {
      throw "Error: Must provide password.";
    }
    if (typeof password !== "string") {
      throw "Error: Password must be a string.";
    }
    password = password.trim();
    if (password.length === 0) {
      throw "Error: Password cannot be an empty string or just spaces.";
    }
    if (password.length < 8) {
      throw "Error: Password must be at least 8 characters long.";
    }
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/; //https://stackoverflow.com/questions/19605150/regex-for-password-must-contain-at-least-eight-characters-at-least-one-number-a
    if (!passwordRegex.test(password)) {
      throw "Error: Password must contain at least one uppercase letter, one digit, and one special character.";
    }
    return password;
  },
  validBorough(borough) {
    if (typeof borough !== "string") {
      throw "Error: Borough must be a string.";
    }
    borough = borough.trim().toLowerCase();
    const validBoroughs = [
      "manhattan",
      "brooklyn",
      "queens",
      "bronx",
      "staten island",
    ];
    if (!validBoroughs.includes(borough)) {
      throw "Borough must be Manhattan, Brooklyn, Queens, Bronx, or Staten Island";
    }

    if (borough == "staten island") {
      borough = "Staten Island";
    } else {
      borough = borough.charAt(0).toUpperCase() + borough.slice(1);
    }
  },
  validEmail(email) {
    if (!email) {
      throw "Error: Must provide email.";
    }
    if (typeof email !== "string") {
      throw "Error: email must be a string.";
    }
    email = email.trim();
    if (email.length === 0) {
      throw "Error: email cannot be an empty string or just spaces.";
    }
    const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //from https://www.mailercheck.com/articles/email-validation-javascript
    if (!email_regex.test(email)) {
      throw "Error: email must be a valid email format.";
    }
    return email;
  },
  validEventType(eventType) {
    if (typeof eventType !== "string") {
      throw "Error: Event type must be a string.";
    }
    eventType = eventType.trim();
    return eventType;
  },
  checkId(id) {
    //COMEBACK: MAYBE NEED
    if (!id) throw "Error: You must provide an id";
    if (typeof id !== "string") throw "Error: id must be a string";
    id = id.trim();
    if (id.length === 0)
      throw "Error: id cannot be an empty string or just spaces";
    if (!ObjectId.isValid(id)) throw "Error: is musr be valid object ID";
    return id;
  },
  validDate(dateString) {
    if (!dateString) {
      throw "Error: Must provide date.";
    }
    if (typeof dateString !== "string") {
      throw "Error: Date must be a string.";
    }
    dateString = dateString.trim();

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      throw "Error: Date must be in YYYY-MM-DD format.";
    }

    const [year, month, day] = dateString.split("-").map(Number); //https://stackoverflow.com/questions/68637321/js-get-part-of-date-from-string

    if (month < 1 || month > 12) {
      throw "Error: Month must be between 01 and 12.";
    }

    if (day < 1 || day > 31) {
      throw "Error: Day must be between 01 and 31.";
    }
    const date = new Date(year, month - 1, day);

    if (date.getMonth() + 1 !== month) {
      throw "Error: Invalid date.";
    }

    return dateString;
  },
  validAge(birthday) {
    //ensures user is over 13 for data collection but they are not over 100
    if (!birthday) {
      throw "Error: Must provide birthday.";
    }

    birthday = exportedMethods.validDate(birthday);
    const dob = new Date(birthday);
    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      //Birthday has not happened yet this year
      age--;
    }

    if (age < 13) {
      throw "Error: You must be 13 or older to use this website.";
    }

    if (age > 100) {
      throw "Error: Age cannot be over 100 years old.";
    }
    return birthday;
  },
  validCommunityBoard(communityBoard) {
    const trimmed = communityBoard.trim();
    const num = parseInt(trimmed);

    if (isNaN(num)) {
      throw "Error: Community board must be a positive integer.";
    }

    if (num < 1 || !Number.isInteger(num)) {
      throw "Error: Community board must be a positive integer.";
    }

    return trimmed;
  },
};

export default exportedMethods;
