let request = require('request');

const _config = {
    unsplashApplicationId: 'UNSPLASH-APPLICATION-ID',
    unsplashApiEndpoint: 'http://api.unsplash.com'
};

let searchReqOptions = {
    url: '',
    headers: {
        'Authorization': 'Client-ID ' + _config.unsplashApplicationId
    },
    json: true
};

function asyncUnsplashSearch(subject) {
    return new Promise(function(resolve, reject) {

        // Update URL with search query
        searchReqOptions.url = _config.unsplashApiEndpoint + '/search/photos/?query=' + subject;

        // Execute API request
        request.get(searchReqOptions, function(err, res, body) {

            // Catch errors, reject promise
            if (err || typeof body.results !== 'object') { return reject(err); }

            // Resolve, passing results array field from the API response
            return resolve(body.results);

        });

    });
}

let fetchFromUnsplash = (subjects, callback) => {

    // Store a reference to our async request promises
    let requestPromises = [];

    // For each subject, generate a promise
    for (let subject of subjects) {
        requestPromises.push(asyncUnsplashSearch(subject));
    }

    // Once all of our promises resolve, trigger callback
    Promise.all(requestPromises).then((allData) => {
        callback(allData);
    });

};

function getRandomIntBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

module.exports = (bp) => {

    // Load botpress middlewares
    bp.middlewares.load();

    // Listen for all messages received from the facebook platform
    bp.hear({ platform: 'facebook', type: 'message', text: /[\s\S]*/ }, (event, next) => {

        // Store the senders full name for easy access
        let first_name = event.user.first_name;

        // Message to send when the bot fails to understand input
        function notUnderstood() {
            bp.messenger.sendText(
                event.user.id,
                'Sorry, I don\'t quite understand what you mean. You can ask me things like:\n\n' +
                '"Show me photos of cats, dogs and pizza"\n' +
                '"Photos of pizza"\n' +
                '"I like Pizza"\n\n' +
                'In case you didn\'t notice, I like Pizza 🍕',
                { typing: true }
            );
        }

        // Send back a single picture
        // Accepts a delay to help avoid messages returning in the wrong order
        // TODO: Investigate whether Facebook provides a "received by server" event/callback to avoid timeout
        function sendPicture(picture, delay) {
            setTimeout(() => {

                // Send the actual image
                bp.messenger.sendAttachment(
                    event.user.id,
                    'image',
                    picture.urls.small
                );

                // Send the description of the image with download link
                bp.messenger.sendText(
                    event.user.id,
                    'You can download ' + picture.user.name + '\'s photo here: ' + picture.links.html,
                    { typing: true }
                );

            }, delay);
        }

        // Check the wit.ai middleware appended to the event
        if (typeof event.wit.entities !== 'undefined') {

            let entities = event.wit.entities;
            let isGreeting = false;
            let isThanks = false;
            let subjects = [];

            // Check the wit.ai metadata to see if it found any "greetings"
            // E.g "hi", "hello", "hey", etc
            if (typeof entities.greeting !== 'undefined' && entities.greeting.length > 0) {
                isGreeting = true;
            }

            // Check the wit.ai metadata to see if it found any "thanks"
            // E.g "thanks", "awesome", "nice", "good job" etc
            if (typeof entities.thanks !== 'undefined' && entities.thanks.length > 0) {
                isThanks = true;
            }

            // Check the wit.ai metadata to see if it found any "subjects"
            if (typeof entities.subject !== 'undefined') {
                for (let subject of entities.subject) {
                    // Push subject values (e.g "cats") to subjects array
                    subjects.push(subject.value);
                }
            }

            // Check to see if any photo subjects were found
            if (subjects.length >  0) {

                // Fetch API response for all subjects
                fetchFromUnsplash(subjects, (allResults) => {

                    // Store the pictures we wish to return to the user
                    let pictures = [];

                    // Loop through results of multiple API calls
                    for (let result of allResults) {
                        // Check for results
                        if (result.length > 0) {
                            // Pick a random picture
                            let randomPicture = result[getRandomIntBetween(0, (result.length - 1))];
                            // Store to send back to user
                            pictures.push(randomPicture);
                        }
                    }

                    // Check we have more than 1 image to send back to the user
                    if (pictures.length > 0) {

                        // Check to see if the user greeted us, we've got to be polite!
                        if (isGreeting) {

                            // Send message back to user with greeting
                            bp.messenger.sendText(
                                event.user.id,
                                'Hey ' + first_name + ', here\'s what I found..',
                                { typing: true }
                            );

                        } else {

                            // Send message back to user without greeting
                            bp.messenger.sendText(
                                event.user.id,
                                'Here\'s what I found..',
                                { typing: true }
                            );

                        }

                        // Wait 500ms then start sending results with a delay of 1 sec between each
                        setTimeout(() => {
                            for (let i = 0; i < pictures.length; i++) {
                                sendPicture(pictures[i], i * 1000);
                            }
                        }, 500);

                    } else {

                        // Unsplash didn't find anything, send a message informing the user
                        bp.messenger.sendText(
                            event.user.id,
                            'Sorry ' + first_name + ', I couldn\'t find anything 😔',
                            { typing: true }
                        );

                    }

                });

            } else {

                // Wit.ai found no "subjects" in the users input
                // Check to see if wit.ai found a greeting or thanks instead
                if (isGreeting) {

                    // "greeting" found, say hello!
                    bp.messenger.sendText(
                        event.user.id,
                        'Hi there, ' + first_name + '!',
                        { typing: true }
                    );

                } else if (isThanks) {

                    // "thanks" found, tell the user it's not a problem!
                    bp.messenger.sendText(
                        event.user.id,
                        'No problem, I\'m happy to help ☺️',
                        { typing: true }
                    );

                } else {

                    // Looks like we've not found a photo subject, a greeting or any thank you input
                    // Send the generic not understood message
                    notUnderstood();
                }

            }

        } else {

            // Wit middleware didn't append any metadata, send misunderstood message
            notUnderstood();

        }

    });

};