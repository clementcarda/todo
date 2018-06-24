const router = require('express').Router()

const db = require('sqlite')
const bcrypt = require('bcrypt')
const hat = require('hat')

//OPEN DB
db.open('expressapi.db')

//VIEW: GET FORM
router.get('/login', (req, res, next) => {
  res.format({
    html: () => {
      res.render('sessions/login', {
        title: 'Connecter vous',
        action: '/sessions'
      })
    },
    json: () => { next(new Error('Bad Request')) }
  })
})

//POST SESSION
router.post('/', (req, res, next) =>{
  if(!req.body.pseudo || !req.body.password) {
    next(new Error('All fields must be given.'))
    res.send('erreur')
  }
  const accessToken = hat()
  const expireAt = new Date()
  expireAt.setHours(expireAt.getHours() +1 )
  // expireAt.setMinutes(expireAt.getMinutes() + 1)
  db.get("SELECT id, pseudo, password FROM users WHERE pseudo = ?", req.body.pseudo)
    .then((user) => {
      bcrypt.compare(req.body.password, user.password)
        .then((result) => {
          if (result){
            db.run("INSERT INTO sessions VALUES (?, ?, ?, ?)", user.id, accessToken, new Date(), expireAt)
              .then(() => {
                res.format({
                  html: () => {
                req.session.accessToken = accessToken
                console.log(accessToken)
                res.redirect('/')
                  },
                  json: () => {
                    res.send({ accessToken: accessToken })
                  }
                })
              }).catch(next)
          }
        })
    }).catch(next)
})

//DELETE SESSION
router.delete('/delete', (req, res, next) => {
  for (let i = 0; i < req.body.tokens.length; i++){
    db.run("DELETE FROM sessions WHERE accessToken = ?", req.body.tokens[i])
  }
})


module.exports = router