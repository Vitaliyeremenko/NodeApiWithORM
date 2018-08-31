const auth = require('../middlewares/is_auth');
const multer  = require('multer');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './store/images')
  },
  filename: function (req, file, cb) {
    const fileAr = file.originalname.split('.');
    cb(null, file.fieldname + '-' + Date.now()+ '.' + fileAr[fileAr.length-1]);
}
});


let upload = multer({storage: storage });


module.exports = function (app,db) {
  const {User, Item} = db;
  const is_auth = auth(User);

  function findOneById(req,res,id) {
    Item.findOne({
      where : {id:id},
      attributes: ['id','createdAt','title','description','image','user_id'],
      include: [
        {model: User, required: true, attributes: ['id','phone','name','email']}
      ]
    }).then(result => {
      if(result)
        res.json(result);
      else
        res.status(404).json();
    })
  }

  function update(req,res,updateField) {
    Item.update(updateField,{where:{ id: req.params.id}})
      .then( result => {
        if(result)
          findOneById(req,res,req.params.id);
        else
          res.status(404).json()
      });
  }

  //@description Create new item Route
  app.put('/api/item',is_auth,(req,res) => {

    const {title, description} = req.body;
    const validationArray = [];

    !title ? validationArray.push({"field":"title","message":"Title is required"}) : null;
    !description ? validationArray.push({"field":"description","message":"Title is required"}) : null;

    if(validationArray.length !== 0){
      res.status(422).json(validationArray);
    }

    User.findOne(
      { where: { session_token: req.headers['authorization']},
        attributes: ['id', 'phone','email','name']})
      .then(user => {
        Item.create({title,description, user_id : user.id})
          .then(result =>{
            res.json({...result.dataValues,user: user.dataValues})
          })
          .catch(err => res.status(503).json(err))
      });
  });

  //@description Delete new item Route
  app.delete('/api/item/:id',is_auth,(req,res) => {
    Item.destroy({
      where: { id: req.params.id},
    }).then(result =>{
      if(result){
        res.status(200).json();
      }else{
        res.status(404).json();
      }
    }).catch(err => res.status(503).json(err))
  });

  //@description Update new item Route
  app.put('/api/item/:id',is_auth, (req,res) => {
    const {title, description} = req.body;

    if(title && title.length < 3){
      res.status(402).json({"field":"title", "message":"Title should contain at least 3 characters"})
    }
    update(req,res,{title,description})
  });

  //@description find all item
  app.get('/api/item',(req,res)=> {
    const {title, user_id,order_by = 'createdAt', order_type="desc"} = req.query ;
    const whereParams = {};
    title ? whereParams.title = title : null;
    user_id ? whereParams.user_id = title : null;
    Item.findAll({
      where: whereParams,
      order: [[order_by,order_type]]
    })
      .then(result => {
        res.json(result);
      })
  });

  //@description find item by
  app.get('/api/item/:id',is_auth,(req,res) => {
    findOneById(req,res,req.params.id);
  });
  //@description update image
  app.post('/api/item/:id/image',is_auth,upload.single('file'),(req,res)=> {
      let file = req.file;console.log(file);
      if(file.size < 100000){
        fs.unlinkSync('./' + file.path); // redo
        res.status(422).json({
          "field":"image", "message":"The file {file} is too big. " }
        )
      }else{
        update(req,res,{image: file.filename})
      }
  });

  //@description delete image by item id
  app.delete('/api/item/:id/image',is_auth,(req,res) => {
    Item.findOne({where : { id : req.params.id},
      attributes: ['image']})
      .then(result => {
        if(result){
          fs.unlinkSync('./store/images/' + result.image);
          Item.update({image: ''},{where:{ id: req.params.id}})
            .then( result =>  res.status(200).json() ).catch(err => res.status(503).json(err));
        }else{
          res.status(404).json();
        }
      }).catch(err => res.status(503).json(err));
  });


};