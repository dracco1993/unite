var request = require('request')
var express = require('express')
var bodyParser = require('body-parser')
var session = require('express-session')
var ejs = require('ejs')
var app = express()
var knex = require('knex')({
  client: 'pg',
  connection: (process.env.DATABASE_URL || 'postgres://localhost/jason'),
  searchPath: 'knex,public'
})
var bookshelf = require('bookshelf')(knex)
var models = require('./models')
var User = models.User,
    Team = models.Team,
    Game = models.Game,
    Mode = models.Mode
var passport = require('passport')
var OAuth2Strategy = require('passport-oauth2').Strategy
var shortid = require('shortid32')
var Pusher = require('pusher')
var Discord = require('discord.io')

// Pusher info
var pusher = new Pusher({
  appId: '241889',
  key: '3aa26893ee89f046e2a3',
  secret: '38b7e8bf90e6a743992a',
  encrypted: true
})

// Discord bot info
var bot = new Discord.Client({
    autorun: true,
    token: "mfa.DjhEw1V3LRuXXJReQ93KJspoXVQiB42yxo2lT4x1akx122rI2yzkuMoJkYsbow1z5bTYxYb7bFp2O3W7iXAK"
})

bookshelf.plugin('registry')

// Middleware
app.use(session({ secret: 'keyboard cat' }))
app.use(passport.initialize())
app.use(passport.session())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))

// Discord authentication
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

// Join a Team
app.get('/team', function (req, res) {
  var user = (req.user || {attributes: {}})
  var loggedIn = req.isAuthenticated()

  if(!loggedIn) {
    res.redirect('/')
  } else {
    res.render('team', {user: user.attributes, loggedIn: loggedIn})
  }
})

// Login
app.get('/login',
  passport.authenticate('oauth2', { scope: ['identify', 'email'] }))

app.get('/login/auth',
  passport.authenticate('oauth2', { successRedirect: '/', failureRedirect: '/login' }))

// API ROUTES - GET
app.get('/api/v1/users', function(req, res){
  knex
    .select()
    .from('users')
    .then(function(data){
      res.json(data)
    })
})

app.get('/api/v1/teams', function(req, res){
  var team = new Team
  var user = req.user

  if (!req.query.id) {
    Team.fetchAll()
      .then(function(data){
        res.send(data.toJSON())
      })
  } else {
    Team.where('id', req.query.id).fetch({withRelated: ['game', 'users', 'mode']})
    .then(function(team){
      knex('user_team')
        .where('user_id', user.id)
        .del()
        .then(function(){
          team.addUser(user)
          pusher.trigger('team_' + req.query.id, 'player_joined', user)
          res.send(team.toJSON())
        })
    })
  }
})

app.get('/api/v1/games', function(req, res){
  if (!req.query.id) {
    Game.fetchAll({withRelated: ['teams']})
      .then(function(data){
        res.send(data.toJSON())
      })
  } else {
    Game.where('id', req.query.id).fetch({withRelated: ['teams', 'teams.users', 'teams.mode', 'modes']})
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

// API ROUTES - POST
app.post('/api/v1/teams', function(req, res){
  var loggedIn = req.isAuthenticated()
  var invite = shortid.generate()
  var team = new Team
  var user = req.user

  if (!loggedIn) {
    res.redirect('/')
  }
  else {
    // Handle hidden value for open/closed access checkbox
    if (Array.isArray(req.body.access)) {
      req.body.access = 'false'
    } else {
      req.body.access = 'true'
    }

    team.set({game_id: req.body.game_id, seriousness: req.body.seriousness, description: req.body.description, access: req.body.access, invite: invite, mode_id: req.body.mode_id, creator_id: user.id})

    team.save()
    .then(function(team){
      knex('user_team')
        .where('user_id', user.id)
        .del()
        .then(function(){
          team.addUser(user)
          res.redirect('/team?id=' + team.id)
        })
    })
  }
})

// Discord bot code

bot.on('ready', function(event) {
  console.log('Logged in as %s - %s\n', bot.username, bot.id)
})

bot.on('disconnect', function(errMsg, code) {
  bot.connect()
})


app.use(express.static(__dirname + '/public'))

app.listen(app.get('port'), function () {
  console.log('Example app listening on port', app.get('port'))
})
