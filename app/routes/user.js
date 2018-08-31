const uuid = require('uuid/v4');
const auth = require('../middlewares/is_auth');


module.exports = function (app,db) {
  const {User} = db;
  //Auth midllware
  const is_auth = auth(User);
  //helper for find user
  function returnUser(req,res,whereParams) {
    User.findOne({ where: { ...whereParams }, attributes: ['id', 'phone','email','name']})
      .then(result=> result ? res.json(result) : res.status(404).json())
      .catch(err =>{res.status(503).json(err)})
  }
  // @description Router for user login
  app.post('/api/login',(req,res) =>{
    let session_token = uuid();

    User.findOne({ where: {email: req.body.email}})
      .then(result => {

        if(!result){
          res.status(422).json([ {field: 'email', message: 'Email not exist'}]);
        }
        else if(result.password !== req.body.password){
          res.status(422).json([ {field: 'password', message: 'Password not correct'}]);
        }else{
         User.update({
           session_token: session_token
          },{
            where: { email: req.body.email},
          }).then(() => {
              res.json({token: session_token});
          }).catch(err =>{
           res.status(503).json(err);
         });
        }



      })
      .catch(err =>{
      res.status(503).json(err);
    });
  });

  // @description Router for registration
  app.post('/api/register', (req,res) => {

    let session_token = uuid();

    User.findOne({ where: {email: req.body.email}})
      .then(result => {

        if(result){
          res.status(422).json([ {field: 'email', message: 'Email exist'}]);
        }
        else {
          User.create({
            email: req.body.email,
            password: req.body.password,
            name: req.body.name,
            phone: req.body.phone,
            session_token: session_token
          }).then( () => {
            res.status(200).json({token: session_token });
          })
        }



      }).catch(err =>{
      res.status(503).json(err);
    });

  });

  // @description Router For get current user
  app.get('/api/me',is_auth,(req,res) => {
    User.findOne({ where: { session_token: req.headers['authorization']}, attributes: ['id', 'phone','email','name']})
      .then(result => {
          res.json(result)
      })
      .catch(err =>{
        res.status(503).json(err);
      })

  });

  // @description Router For update current user
  app.put('/api/me',is_auth,(req,res) => {
    const {phone,name,email,current_password,new_password} = req.body;

    function update(data) {
      User.update(data,{
        where: { session_token: req.headers['authorization']},
      }).then(result => returnUser(req,res,{session_token: req.headers['authorization']}))
        .catch(err =>{res.status(503).json(err)});
    }

    if(!current_password){ update({phone,name,email})}
    else if(!current_password && new_password) {
      res.status(422).json([ {"field":"current_password", "message":"Wrong current password" }])
    }
    else{
      User.findOne({ where: { session_token: req.headers['authorization']}, attributes:['password']})
        .then(result => {
          if(result.password !== current_password){
            res.status(422).json([ {"field":"current_password", "message":"Wrong current password" }])
          }else if(!new_password || new_password.length < 6){
            res.status(422).json([ {"field":"new_password", "message":"Incorrect new password" }])
          }else{ update({phone,name,email, password: new_password}) }
        }).catch(err =>{res.status(503).json(err)})
    }

  });

  // @description Router get user by id
  app.get('/api/user/:id',is_auth,(req,res) => returnUser(req,res,{id:req.params.id}) );

  // @description Router get all users
  app.get('/api/user',(req,res) => {
    const whereQuery = req.query ? {...req.query} : "";
    User.findAll({where: whereQuery})
      .then(result => {
        result ? res.json(result) : res.status(404).json();
      }).catch(err =>{res.status(503).json(err)})
  })
};