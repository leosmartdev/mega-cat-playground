const GoogleStrategy = require('passport-google-oauth20').Strategy
const mongoose = require('mongoose')
const db = require("../app/models");
const User = db.users;

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'http://localhost:4200/login',
      },
      async (accessToken, refreshToken, profile, done) => {
        //get the user data from google
        const user = {
          googleId: profile.id,
          displayName: profile.displayName,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          image: profile.photos[0].value,
          usernameOrEmail: profile.emails[0].value
        }

        let newUser = new User({
        'username': profile.displayName,
        'password': hash,
        'first_name': profile.name.givenName,
        'last_name': profile.name.familyName,
        'usernameOrEmail': profile.emails[0].value,
        'googleId': profile.id
        });



        try {
          //find the user in our database
          let user = await User.findOne({ googleId: profile.id })

          if (user) {
            //If user present in our database.
            done(null, user)
          } else {
            // if user is not preset in our database save user data to database.
            user = await User.create(newUser)
            done(null, user)
          }
        } catch (err) {
          console.error(err)
        }
      }
    )
  )
}
