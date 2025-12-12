import helpers from './client-helpers.js';

const form = document.getElementById('event-form');

if(form) {
    const nameContainer = document.getElementById('eventName');
    const typeContainer = document.getElementById('eventType');
    const locationContainer = document.getElementById('eventLocation');
    const boroughContainer = document.getElementById('eventBorough');
    const startContainer = document.getElementById('startDateTime');
    const endContainer = document.getElementById('endDateTime');
    const roadClosureContainer = document.getElementById('streetClosureType')
    const isPublicContainer = document.getElementById('isPublic');

    const errorContainer = document.getElementById('error-here');
    const serverError = document.getElementById('server-error');

    form.addEventListener('submit', (event) => {
        try {
            const clientError = document.getElementById('client-error');

            if (serverError) serverError.hidden = true;
            if (clientError) clientError.hidden = true;

            let errorList = [];

            let eventName = nameContainer.value;
            let eventType = typeContainer.value;
            let eventLocation = locationContainer.value;
            let eventBorough = boroughContainer.value;
            let startDateTime = startContainer.value;
            let endDateTime = endContainer.value;
            let roadClosureType = roadClosureContainer.value;
            let isPublic = isPublicContainer.value;

            try{
                eventName = helpers.validEventName(eventName);
            } catch(e) {
                errorList.push(e);
            }

            try{
                eventType = helpers.validEventType(eventType);
            } catch(e) {
                errorList.push(e);
            }

            try{
                eventLocation = helpers.validLocation(eventLocation);
            } catch(e) {
                errorList.push(e);
            }

            try{
                eventBorough = helpers.validBorough(eventBorough);
            } catch(e) {
                errorList.push(e);
            }

            try {
                startDateTime = helpers.validDateTime(startDateTime,'Start');
            } catch(e) {
                errorList.push(e);
            }

            try{
                endDateTime = helpers.validDateTime(endDateTime,'End');
                helpers.validStartEndTimeDate(startDateTime,endDateTime);
            } catch(e) {
                errorList.push(e);
            }

            try {
                roadClosureType = helpers.validStreetClosure(roadClosureType);
            } catch(e) {
                errorList.push(e);
            }

            try {
                
            } catch(e) {
                errorList.push(e);
            }

            if(errorList.length > 0) {
                throw errorList;
            }

            document.getElementById('startReturn').value = startDateTime;
            document.getElementById('endReturn').value = endDateTime;
 
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
        }
    })
}