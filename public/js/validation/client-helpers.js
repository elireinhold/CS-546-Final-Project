const exportedMethods = {
    addToList(elem,msg) {
        let insert = document.createElement('li')
        insert.textContent = msg;
        elem.appendChild(insert);
        return elem;
    },
    // User functions
    validUsername(username,args) {
        let login = false 
        if(args && typeof args === object) {
            if(args.login) {
                register = args.login;
            }
        }
        if (!username) {
            throw "Error: Must provide username.";
        }
        if (typeof username !== "string") {
            throw "Error: Username must be a string.";
        }
        username = username.trim();
        if (username.length === 0) {
            throw "Error: Username cannot be an empty string or just spaces.";
        }
        if(!login) {
            if (username.length < 5 || username.length > 10) {
                throw "Error: Username must be between 5 and 10 characters long.";
            }
            const userNameRegex = /^[A-Za-z0-9]+$/;
            if (!userNameRegex.test(username)) {
                throw "Error: Username must contain only alphanumeric characters.";
            }
        }   
        return username;
    },
    validPassword(password,args) {
        let login = false;
        if(args && typeof args === object) {
            if(args.login) {
                login = args.login;
            }
        }
        if (!password) {
            throw "Error: Must provide password.";
        }
        if (typeof password !== "string") {
            throw "Error: Password must be a string.";
        }
        if(!login) {
            if (password.length < 8) {
                throw "Error: Password must be at least 8 characters long.";
            }
            const passwordRegex =
                /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/; //https://stackoverflow.com/questions/19605150/regex-for-password-must-contain-at-least-eight-characters-at-least-one-number-a
            if (!passwordRegex.test(password)) {
                throw "Error: Password must contain at least one uppercase letter, one digit, and one special character.";
            }
            return password;
        }
    },
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
        if (!eventType) {
        throw "Error: Event type is required.";
        }
        if (typeof eventType !== "string") {
        throw "Error: Event type must be a string.";
        }
        eventType = eventType.trim();

        const eventTypes = [
        "Special Event",
        "Sport - Adult",
        "Sport - Youth",
        "Production Event",
        "Open Street Partner Event",
        "Plaza Partner Event",
        "Street Event",
        "Religious Event",
        "Farmers Market",
        "Sidewalk Sale",
        "Theater Load in and Load Outs",
        "Parade",
        "Miscellaneous",
        "Plaza Event",
        "Block Party",
        "Clean-Up",
        ];

        if (!eventTypes.includes(eventType)) {
        throw "Error: Event type must be valid. The valid event types are: 'Special Event', 'Sport - Adult', 'Sport - Youth', 'Production Event','Open Street Partner Event', 'Plaza Partner Event','Street Event','Religious Event','Farmers Market','Sidewalk Sale','Theater Load in and Load Outs','Parade','Miscellaneous','Plaza Event','Block Party','Clean-Up'";
        }
        return eventType;
    },
    validAge(birthday) {
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
        return borough;
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
    }
}

export default exportedMethods;