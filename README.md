# UnsplashMessengerBot

An open source Facebook Messenger bot to help find beautiful photos from Unsplash.


## Setup

The following setup assumes you already have [Node.js](https://nodejs.org) installed and know how to compile Typescript files via the command line or an IDE.


#### 1) Clone this repository

`git clone https://github.com/Jamie452/UnsplashMessengerBot.git`


#### 2) Install the [Botpress](https://botpress.io/) framework globally

`npm install -g botpress`


#### 3) From inside the repository folder run the following to install the projects dependencies

`npm install`


#### 4) Set your Unsplash Application ID within index.ts

```javascript
const _config = {
    unsplashApplicationId: 'UNSPLASH-APPLICATION-ID',
    unsplashApiEndpoint: 'http://api.unsplash.com'
};
```


#### 5) Start the botpress server

`botpress start`


#### 6) Navigate to http://localhost:3000/ to access the server


#### 7) Configure the Botpress Messenger module by following [this guide](https://github.com/botpress/botpress-messenger#get-started)


#### 8) Configure the Botpress Wit module with your [wit.ai](https://wit.ai/) account details and set the mode to "understanding"


#### 9) Train Wit to understand entities

Within your Wit account, under the understanding tab, start training the bot to extract "subject" entities with multiple sentences like:
 
 "Show me photos of cats"
 "Find photos of cats"
 "Find photos of dogs"
 "Photos of dogs"
 
 To start with you will need to select and set the subject for each sentence you train the neural network with. Over time the understanding will get better and begin to automatically select the subject automatically, in which case you will need to "Validate" the neural networks understanding. The more creative you can get with the training sentences, the better.
 
 To accommodate the current functionality of the bot you will need to repeat this process for the following entities:

- greeting (Search strategy: trait, keywords)
- thanks (Search strategy: trait, keywords)
- subject (Search strategy: trait, free-text, keywords)


#### 10) Chat to the bot, validate/tweak responses through wit.ai inbox, repeat

## Todo

- Provide a ready trained export of wit.ai data.