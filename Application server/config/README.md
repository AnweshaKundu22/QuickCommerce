*Note*: For the jwtSecret, can you generate use any random string or generate it using the below terminal command:

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

Copy the string and use it for jwtSecret.
