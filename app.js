// Dépendances native
const path = require('path')

// Dépendances 3rd party
const express = require('express')
const bodyParser = require('body-parser')
const sass = require('node-sass-middleware')

const db = require('sqlite')
const session = require('express-session')
const methodeOverride = require('method-override')

// Constantes et initialisations
const PORT = process.PORT || 8080
const app = express()

//DATABASE
db.open('expressapi.db').then(() => {
  db.run('CREATE TABLE IF NOT EXISTS users (id, pseudo, password, email, firstname, lastname, createdAt, updatedAt)')
    .then(() => {
      db.run('CREATE TABLE IF NOT EXISTS sessions (userId, accessToken, createdAt, expiresAt)')
        .then(() => {
          db.run("CREATE TABLE IF NOT EXIST todos (userId, message, createdAt, updateAt, completedAt)")
            .then(() => { console.log('> Database ready') })
        })
    }).catch((err) => { // Si on a eu des erreurs
    console.error('ERR> ', err)
  })
})

// Mise en place des vues
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//OVERRIDE POST
app.use(methodeOverride('_method'))

// Middleware pour parser le body
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

//SESSION
app.set('trust proxy', 1)
app.use(session({
  secret: 'topkek',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60,
    httpOnly: true
  }
}))

// Préprocesseur sur les fichiers scss -> css
app.use(sass({
  src: path.join(__dirname, 'styles'),
  dest: path.join(__dirname, 'assets', 'css'),
  prefix: '/css',
  outputStyle: 'expanded'
}))

// On sert les fichiers statiques
app.use(express.static(path.join(__dirname, 'assets')))

// LOGGER
app.use((req, res, next) => {
  next()
  console.log('REQUEST: ' + req.method + ' ' + req.url)
})

//midleware gestion authentification
app.use(function (req, res, next) {
  res.format({
    html: () => {
      if (req.session.accessToken){
        db.get("SELECT FROM users WHERE accessToken = ?", req.session.accessToken)
          .then((sess) => {
            if (sess.expiredAt.getHours() < new Date().getHours()){
              res.redirect('/sessions/login')
            }
          })
      } else {
        res.redirect('/sessions/login')
      }
    },
    json: () => {
      if(req.query.X-AccessToken){
        db.get("SELECT FROM users WHERE accessToken = ?", req.query.X-AccessToken)
          .then((sess) => {
            if(sess.expiredAt.getHours() < new Date().getHours()){
              next
            }
          })
      }
    }
  })
})

// La liste des différents routeurs (dans l'ordre)
app.use('/', require('./routes/index'))
app.use('/users', require('./routes/users'))
app.use('/sessions', require('./routes/sessions'))
app.use('/todos', require('./routes/todos'))

// Erreur 404
app.use(function(req, res, next) {
  let err = new Error('Not Found')
  err.status = 404
  next(err)
})

// Gestion des erreurs
// Notez les 4 arguments !!
app.use(function(err, req, res, next) {
  // Les données de l'erreur
  let data = {
    message: err.message,
    status: err.status || 500
  }

  // En mode développement, on peut afficher les détails de l'erreur
  if (app.get('env') === 'development') {
    data.error = err.stack
  }

  // On set le status de la réponse
  res.status(data.status)

  // Réponse multi-format
  res.format({
    html: () => { res.render('error', data) },
    json: () => { res.send(data) }
  })
})

app.listen(PORT, () => {
  console.log('Serveur démarré sur le port : ', PORT)
})