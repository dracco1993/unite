var request = require('request')
var express = require('express')
var session = require('express-session')
var ejs = require('ejs')
var app = express()
var knex = require('knex')({
  client: 'pg',
  connection: (process.env.DATABASE_URL || 'postgres://localhost/jason'),
  searchPath: 'knex,public'
})
var bookshelf = require('bookshelf')(knex)
var ModelBase = require('bookshelf-modelbase')(bookshelf)

bookshelf.plugin('registry')

// MODELS
// User
var User = ModelBase.extend({
  tableName: 'users',
  teams: function() {
    return this.hasMany(Team)
  }
})

// Game
var Game = bookshelf.Model.extend({
  tableName: 'games',
  teams: function() {
    return this.hasMany(Team);
  },
  modes: function() {
    return this.hasMany(Mode)
  }
})

// Game collection
var Games = bookshelf.Collection.extend({
  model: Game
})

// Team
var Team = bookshelf.Model.extend({
  tableName: 'teams',
  game: function() {
    return this.belongsTo(Game);
  },
  user: function() {
    return this.belongsToMany(User, 'user_team')
  },
  mode: function() {
    return this.belongsTo(Mode)
  }
})

// Mode
var Mode = bookshelf.Model.extend({
  tableName: 'modes',
  game: function() {
    return this.belongsTo(Game)
  },
  teams: function() {
    return this.belongsToMany(Team)
  }
})

// Discord authentication
var passport = require('passport')
var OAuth2Strategy = require('passport-oauth2').Strategy

app.use(session({ secret: 'keyboard cat' }))
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser(function(user, done){
  done(null, user.id)
})

passport.deserializeUser(function(id, done){
  User.findById(id)
    .then(function(user){
      done(null, user)
    })
})

passport.use(new OAuth2Strategy({
    authorizationURL: 'https://discordapp.com/api/oauth2/authorize',
    tokenURL: 'https://discordapp.com/api/oauth2/token',
    clientID: '214912632954683394',
    clientSecret: 'EjArQSnT6-3Y59fAWDHLJPZj_fcjF-vb',
    callbackURL: (process.env.HOSTNAME || 'http://localhost:5000') + '/login/auth'
  },
  function(accessToken, refreshToken, profile, cb) {
    request({
      url: 'https://discordapp.com/api/users/@me',
      auth: {
        bearer: accessToken
      }}, function(err, res) {
        var profile = JSON.parse(res.body)

        User.findOrCreate({
          discord_id: profile.id,
          username: profile.username,
          username_full: profile.username + '#' + profile.discriminator,
          email: profile.email,
          avatar: profile.avatar
        })
          .then(function(user) {
            user.set({token: accessToken}).save()
            return cb(null, user)
          })
      })
  }
))

app.set('port', (process.env.PORT || 5000))
app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')

// ENDPOINTS
// Home
app.get('/', function (req, res) {
  var user = (req.user || {attributes: {}})
  var loggedIn = req.isAuthenticated()

  res.render('index', {user: user.attributes, loggedIn: loggedIn})
})


// Join a Game
app.get('/directory', function (req, res) {
  var user = (req.user || {attributes: {}})
  var loggedIn = req.isAuthenticated()

  if(!loggedIn) {
    res.redirect('/')
  } else {
    res.render(!req.query.id ? 'directory' : 'detail', {user: user.attributes, loggedIn: loggedIn, query: req.query.id})
  }
})

// Create a Game
app.get('/create', function (req, res) {
  var user = (req.user || {attributes: {}})
  var loggedIn = req.isAuthenticated()

  if(!loggedIn || !req.query.id) {
    res.redirect('/')
  } else {
    res.render('create', {user: user.attributes, loggedIn: loggedIn})
  }
})

// Login
app.get('/login',
  passport.authenticate('oauth2', { scope: ['identify', 'email'] }))

app.get('/login/auth',
  passport.authenticate('oauth2', { successRedirect: '/', failureRedirect: '/login' }))

// API ROUTES
app.get('/api/v1/users', function(req, res){
  knex
    .select()
    .from('users')
    .then(function(data){
      res.json(data)
    })
})

app.get('/api/v1/teams', function(req, res){
  knex
    .select()
    .from('teams')
    .then(function(data){
      res.json(data)
    })
})

app.get('/api/v1/games', function(req, res){
  if (!req.query.id) {
    Games.forge().fetch({withRelated: ['teams']})
      .then(function(data){
        res.send(data.toJSON())
      })
  } else {
    Games.query({where: {id: req.query.id}}).fetchOne({withRelated: ['teams', 'teams.user', 'teams.mode', 'modes']})
      .then(function(data){
        res.send(data.toJSON())
      })
  }
})

app.get('/api/v1/modes', function(req, res){
  knex
    .select()
    .from('modes')
    .then(function(data){
      res.json(data)
    })
})

app.get('/api/v1/roles', function(req, res){
  knex
    .select()
    .from('roles')
    .then(function(data){
      res.json(data)
    })
})

app.get('/api/v1/friends', function(req, res){
  knex
    .select()
    .from('friends')
    .then(function(data){
      res.json(data)
    })
})

app.get('/api/v1/user_team', function(req, res){
  knex
    .select()
    .from('user_team')
    .then(function(data){
      res.json(data)
    })
})

app.get('/api/v1/user_game', function(req, res){
  knex
    .select()
    .from('user_game')
    .then(function(data){
      res.json(data)
    })
})

app.use(express.static(__dirname + '/public'))

app.listen(app.get('port'), function () {
  console.log('Example app listening on port', app.get('port'))
})
