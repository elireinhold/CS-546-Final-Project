import helpers from './client-helpers.js';

const form = document.getElementById('register-form');

if(form) {
    const usernameContainer = document.getElementById('username');
    const firstNameContainer = document.getElementById('firstName');
    const lastNameContainer = document.getElementById('lastName');
    const emailContainer = document.getElementById('email');
    const passwordContainer = document.getElementById('password');
    const confirmPasswordContainer = document.getElementById('confirmPassword');
    const preferredBoroughContainer = document.getElementById('preferredBorough');
    const preferredEventTypeContainer = document.getElementById('preferredEventType');
    const birthdayContainer = document.getElementById('birthday');

    const errorContainer = document.getElementById('error-here');
    const serverError = document.getElementById('server-error');

    form.addEventListener('submit', (event) => {
        try {
            const clientError = document.getElementById('client-error');

            if (serverError) serverError.hidden = true;
            if (clientError) clientError.hidden = true;

            let errorList = [];

            let username = usernameContainer.value;
            let firstName = firstNameContainer.value;
            let lastName = lastNameContainer.value;
            let email = emailContainer.value;
            let password = passwordContainer.value;
            let confirmPassword = confirmPasswordContainer.value;
            let preferredBorough = preferredBoroughContainer.value;
            let preferredEventType = preferredEventTypeContainer.value;
            let birthday = birthdayContainer.value;

            try{
                username = helpers.validUsername(username);
            } catch(e) {
                errorList.push(e);
            }

            try{
                firstName = helpers.validFirstOrLastName(firstName);
            } catch (e) {
                errorList.push(e);
            }

            try{
                lastName = helpers.validFirstOrLastName(lastName);
            } catch (e) {
                errorList.push(e);
            }

            try{
                email = helpers.validEmail(email);
            }catch(e) {
                errorList.push(e);
            }

            try{
                password = helpers.validPassword(password);
            } catch(e) {
                errorList.push(e);
            }

            if(password !== confirmPassword) errorList.push('Error: Passwords do not match.');

            try{
                preferredBorough = helpers.validBorough(preferredBorough);
            } catch(e) {
                errorList.push(e);
            }

            try{
                birthday = helpers.validAge(birthday)
            } catch(e) {
                errorList.push(e);
            }

            try{
                preferredEventType = helpers.validEventType(preferredEventType);
            } catch(e) {
                errorList.push(e);
            }

            if(errorList.length > 0) {
                throw errorList;
            }

        } catch(e) {
            event.preventDefault();

            if(!Array.isArray(e)) {
                e = [e];
            }

            let errs = document.getElementById('client-error');

            if(errs) {
                errs.remove();
            }

            let ul = document.createElement('ul');
            ul.classList.add('form-error');

            e.forEach((err) => {
                ul = helpers.addToList(ul,err);
            });

            let div = document.createElement('div');
            div.classList.add('form-error');
            div.id = 'client-error';
            div.appendChild(ul)

            errorContainer.appendChild(div);

            passwordContainer.value = "";
            confirmPasswordContainer.value = "";
        }
    })
}