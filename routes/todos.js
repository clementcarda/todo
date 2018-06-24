const router = require('express').Router()

const db = require('sqlite')

//OPEN DB
db.open('expressapi.db')

//GET TODOS
router.get('/', (req, res, next) => {
  res.format({
    html: () => {
      db.get("SELECT userId FROM session WHERE accessToken = ?", req.session.accessToken)
        .then((user) => {
          db.getAll("SELECT * from todos WHERE userId = ?", user[0])
            .then((todos) => {
              res.render('todos/index', {
                todos: todos,
                title: "liste de mes taches"
              })
            })
        })
    },
    json : () => {
      db.get("SELECT userId FROM session WHERE accessToken = ?", req.query.X-AccessToken)
        .then((user) => {
          db.getAll("SELECT * FROM todos WHERE userId = ?", user[0])
            .then((todos) => {
              res.send(todos)
            })
        })
    }
  })
})

//VIEW : POST TODOS
router.get('/new', (req,res, next) => {
  res.format({
    html: () => {
      res.render('todos/edit', {
        title: 'Nouvelle tache',
        todo: {},
        action: '/todos/new'
      })
    },
    json: () => { next(new Error('Bad Request')) }
  })
})

// POST TODOS
router.post('/new', (req, res, next) => {

  if (!req.body.message){
    next(new Error('All fields must be given.'))
    res.send('erreur')
  }
  db.get("SELECT userId FROM sessions WHERE accesToken = ?", req.session.accessToken)
    .then((user) => {
      db.run("INSERT INTO todos VALUES (?, ?, ?, ?, ?)", user[0], req.body.message, new Date(), null, null)
        .then(() => {
          res.format({
            html: () => { res.redirect('/todos') },
            json: () => {res.status(201).send({ message: 'success' })}
          })
        }).catch(next)
    })
})


module.exports = router
