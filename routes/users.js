const router = require('express').Router()
const db = require('sqlite')
const bcryp = require('bcrypt')
const hat = require('hat')

//OPEN DB
db.open('expressapi.db')

// GET ALL USER
router.get('/', function(req, res, next) {
  const wheres = []

  if (req.query.firstname) {
    wheres.push(`firstname LIKE '%${req.query.firstname}%'`)
  }

  if (req.query.lastname) {
    wheres.push(`lastname LIKE '%${req.query.lastname}%'`)
  }

  const limit = `LIMIT ${req.query.limit || 100}`
  const offset = `OFFSET ${ req.query.offset || 0}`
  const where = wheres.length > 0 ? `WHERE ${wheres.join(' AND ')}` : ''
  let order = ''
  let reverse = ''
  if (req.query.order && req.query.reverse) {
    order = `ORDER BY ${req.query.order}`
    if (req.query.reverse == '1') {
      reverse = 'DESC'
    } else if (req.query.reverse == '0') {
      reverse = 'ASC'
    }
  }

  query = `SELECT * FROM users ${where} ${order} ${reverse} ${limit} ${offset}`

  db.all(query)
    .then((users) => {
      res.format({
        html: () => { res.render('users/index', { users: users }) },
        json: () => { res.send(users) }
      })
    }).catch(next)
})

// VIEW: ADD USER
router.get('/add', (req, res, next) => {
  res.format({
    html: () => {
      res.render('users/edit', {
        title: 'Ajouter un Utilisateur',
        user: {},
        action: '/users'
      })
    },
    json: () => { next(new Error('Bad Request')) }
  })
})

// // VIEW: EDIT USER
// router.get('/:userId/edit', (req, res, next) => {
//   res.format({
//     html: () => {
//       db.get('SELECT * FROM users WHERE ROWID = ?', req.params.userId)
//         .then((user) => {
//           if (!user) next()
//           res.render('users/edit', {
//             title: 'Editer un utilisateur',
//             user: user,
//             action: '/users/' + req.params.userId + '?_method=put',
//           })
//         })
//     },
//     json: () => {
//       next(new Error('Bad request'))
//     }
//   })
// })
//
// // GET USER BY ID
// router.get('/:userId', function(req, res, next) {
//   db.get('SELECT * FROM users WHERE ROWID = ?', req.params.userId)
//     .then((user) => {
//       res.format({
//         html: () => { res.render('users/show', { user: user }) },
//         json: () => { res.status(201).send({message: 'success'}) }
//       })
//     }).catch(next)
// })

//POST USER
router.post('/', (req, res, next) => {
  if(!req.body.pseudo || !req.body.password || !req.body.email || !req.body.firstname || !req.body.lastname) {
    next(new Error('All fields must be given.'))
    res.send('erreur')
  }
  bcryp.hash(req.body.password, 10, (err, hash) => {
    db.run("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      hat(), req.body.pseudo, hash, req.body.email, req.body.firstname, req.body.lastname, new Date(), null)
      .then(() => {
        res.format({
          html: () => { res.redirect('/users') },
          json: () => { res.status(201).send({message: 'succes' }) }
        })
      }).catch(next)
  })
})

module.exports = router
