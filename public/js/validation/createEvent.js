import helpers from './client-helpers.js';

const form = document.getElementById('event-form');

if(form) {
    const nameContainer = document.getElementById('eventName');
    const typeContainer = document.getElementById('eventType');
    const locationContainer = document.getElementById('eventLocation');
    const boroughContainer = document.getElementById('eventBorough');
    const startContainer = document.getElementById('startDateTime');
    const endContainer = document.getElementById('endDateTime');
    const roadClosureContainer = document.getElementById('streetClosureType');
    const communityBoardContainer = document.getElementById('communityBoard');
    const publicityContainer = document.getElementsByName('publicity');

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
            let communityBoard = communityBoardContainer.value;
            let publicity = publicityContainer;

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
                startDateTime = helpers.validDateTime(startDateTime);
            } catch(e) {
                errorList.push(e);
            }

            try{
                endDateTime = helpers.validDateTime(endDateTime);
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
                communityBoard = helpers.validCommunityBoard(communityBoard);
            } catch(e) {
                errorList.push(e);
            }

            try {
                let good = false;
                publicity.forEach((d) => {
                    if(!good) good = Boolean(d.checked);
                });
                if(!good) throw "Error: visibility cannot be blank." 
            } catch(e) {
                errorList.push(e);
            }

            if(errorList.length > 0) {
                throw errorList;
            }

            endContainer.value = endDateTime;
            startContainer.value = startDateTime;

            document.getElementById('submit').disabled = true;

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