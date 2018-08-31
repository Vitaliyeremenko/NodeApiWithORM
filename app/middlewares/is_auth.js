
module.exports =  function (User){
  return function (req,res,next) {
    if(!req.headers['authorization']){
      res.status(401).json();
    }
    User.findOne({ where: { session_token: req.headers['authorization']}, attributes: ['id']})
      .then(result => {
        if(result){
          next();
        }else{ res.status(401).json(); }
      })
      .catch(err =>{
        res.status(503).json(err);
      })

  };
};