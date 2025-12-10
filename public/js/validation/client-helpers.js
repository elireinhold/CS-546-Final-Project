const exportedMethods = {
    addToList(elem,msg) {
        let insert = document.createElement('li')
        insert.textContent = msg;
        elem.appendChild(insert);
        return elem;
    },
    validUsername(username) {
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
        if (username.length < 5 || username.length > 10) {
            throw "Error: Username must be between 5 and 10 characters long.";
        }
        const userNameRegex = /^[A-Za-z0-9]+$/;
        if (!userNameRegex.test(username)) {
            throw "Error: Username must contain only alphanumeric characters.";
        }
        return username;
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
    }
}

export default exportedMethods;