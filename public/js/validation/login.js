import helpers from './client-helpers.js';

const form = document.getElementById('login-form');

if(form) {
    const usernameContainer = document.getElementById('username');
    const passwordContainer = document.getElementById('password');

    const errorContainer = document.getElementById('error-here');
    const serverError = document.getElementById('server-error');

    form.addEventListener('submit', (event) => {
        try {
            const clientError = document.getElementById('client-error');

            if (serverError) serverError.hidden = true;
            if (clientError) clientError.hidden = true;

            let errorList = [];

            let username = usernameContainer.value;
            let password = passwordContainer.value;

            try{
                username = helpers.validUsername(username,{login: true});
            } catch(e) {
                errorList.push(e);
            }

            try{
                password = helpers.validPassword(password);
            } catch(e) {
                errorList.push(e);
            }

            if(errorList.length > 0) {
                throw errorList;
            }

            console.log(username);
            console.log(password);

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
        }
    })
}